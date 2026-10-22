"""SevAIQ Explainable Eligibility Engine.

Evaluates citizen profiles against verified government scheme criteria
using transparent, three-valued logic (meets_known_criteria,
does_not_meet_known_criteria, needs_verification).
"""

from typing import Any, Dict, List, Tuple
from app.schemas import CitizenProfile, EligibilityCheckResponse, SchemeEligibilityResult


def evaluate_single_scheme(
    scheme: Dict[str, Any], profile: CitizenProfile
) -> SchemeEligibilityResult:
    """Evaluate a citizen profile against a single verified scheme record.
    
    Implements three-valued logic:
    - does_not_meet_known_criteria: Disqualified by one or more known rules.
    - needs_verification: All evaluated rules pass, but missing/unverified info remains,
                          or stored scheme criteria are incomplete.
    - meets_known_criteria: Every statutory criterion in the scheme is evaluated and satisfied.
    """
    scheme_id = scheme.get("id", "unknown")
    scheme_title = scheme.get("title", "Unknown Scheme")
    category = scheme.get("category", "General")
    official_portal_url = scheme.get("official_portal_url")
    verification_source = scheme.get("verification_source")
    criteria = scheme.get("eligibility_criteria")

    # Incomplete or missing scheme criteria must never be silently marked eligible
    if not criteria or not isinstance(criteria, dict) or len(criteria) == 0:
        return SchemeEligibilityResult(
            scheme_id=scheme_id,
            scheme_title=scheme_title,
            category=category,
            outcome="needs_verification",
            reasons=[
                "Official statutory criteria for this scheme are incomplete or undergoing official verification in the catalog."
            ],
            criteria_matched=[],
            criteria_not_met=[],
            missing_information=["Structured eligibility criteria are not fully indexed for this scheme."],
            official_portal_url=official_portal_url,
            verification_source=verification_source,
        )

    criteria_matched: List[str] = []
    criteria_not_met: List[str] = []
    missing_information: List[str] = []

    # 1. Minimum Age (min_age)
    min_age = criteria.get("min_age")
    if min_age is not None:
        if profile.age is None:
            missing_information.append(f"Age is required to verify minimum age requirement ({min_age}+ years).")
        elif profile.age < min_age:
            criteria_not_met.append(f"Age ({profile.age}) is below the minimum required age of {min_age} years.")
        else:
            criteria_matched.append(f"Age ({profile.age}) satisfies minimum age requirement of {min_age} years.")

    # 2. Maximum Age (max_age)
    max_age = criteria.get("max_age")
    if max_age is not None:
        if profile.age is None:
            missing_information.append(f"Age is required to verify maximum age limit ({max_age} years).")
        elif profile.age > max_age:
            criteria_not_met.append(f"Age ({profile.age}) exceeds the maximum eligible age limit of {max_age} years.")
        else:
            criteria_matched.append(f"Age ({profile.age}) is within the eligible upper age limit of {max_age} years.")

    # 3. Maximum Income Ceiling (max_income_limit)
    max_income = criteria.get("max_income_limit")
    if max_income is not None:
        # Special statutory rule for AB-PMJAY: all senior citizens aged 70+ have universal cover regardless of income
        if scheme_id == "pm-jay" and profile.age is not None and profile.age >= 70:
            criteria_matched.append(
                f"Senior citizen aged {profile.age} (70+) qualifies for universal health cover regardless of income under Ayushman Vay Vandana."
            )
        else:
            if profile.annual_income is None:
                missing_information.append(
                    f"Annual household income is required to verify income limit (₹{int(max_income):,})."
                )
            elif profile.annual_income > max_income:
                criteria_not_met.append(
                    f"Annual income of ₹{int(profile.annual_income):,} exceeds the maximum eligibility limit of ₹{int(max_income):,}."
                )
            else:
                criteria_matched.append(
                    f"Annual income of ₹{int(profile.annual_income):,} is within allowable limit of ₹{int(max_income):,}."
                )

    # 4. Residence Location Type (area_type: 'rural' | 'urban')
    required_area = criteria.get("area_type")
    if required_area is not None:
        if not profile.residence_type:
            missing_information.append(
                f"Location type ('rural' or 'urban') is required to verify {required_area} area restriction."
            )
        elif profile.residence_type.strip().lower() != required_area.strip().lower():
            criteria_not_met.append(
                f"Scheme is restricted to {required_area} areas; profile indicates {profile.residence_type.lower()} residence."
            )
        else:
            criteria_matched.append(
                f"Residence location ({profile.residence_type.lower()}) matches required {required_area} area."
            )

    # 5. Occupation Requirements (occupations: list of allowed titles)
    allowed_occupations = criteria.get("occupations")
    if allowed_occupations and isinstance(allowed_occupations, list):
        if not profile.occupation:
            missing_information.append(
                f"Occupation is required to verify professional criteria (eligible: {', '.join(allowed_occupations)})."
            )
        else:
            user_occ = profile.occupation.strip().lower().replace("-", " ").replace("_", " ")
            is_match = False
            for allowed in allowed_occupations:
                norm_allowed = allowed.strip().lower().replace("-", " ").replace("_", " ")
                if norm_allowed in user_occ or user_occ in norm_allowed:
                    is_match = True
                    break
            if is_match:
                criteria_matched.append(f"Occupation '{profile.occupation}' matches eligible occupations.")
            else:
                criteria_not_met.append(
                    f"Occupation '{profile.occupation}' does not match scheme target occupations ({', '.join(allowed_occupations)})."
                )

    # 6. Cultivable Land Ownership (land_ownership_required)
    land_required = criteria.get("land_ownership_required")
    if land_required is True:
        if profile.owns_cultivable_land is None:
            missing_information.append("Cultivable agricultural landholding status is required for this scheme.")
        elif profile.owns_cultivable_land is False:
            criteria_not_met.append("Cultivable land ownership is mandatory; citizen profile indicates no landholding.")
        else:
            criteria_matched.append("Citizen holds cultivable agricultural land as required.")

    # 7. Pucca House Ownership (owns_pucca_house: False means must not own pucca house)
    pucca_disqualifies = criteria.get("owns_pucca_house")
    if pucca_disqualifies is False:
        if profile.owns_pucca_house is None:
            missing_information.append("Housing status (whether owning a pucca house) is required for housing assistance.")
        elif profile.owns_pucca_house is True:
            criteria_not_met.append(
                "Citizen already owns a permanent pucca house; scheme requires applicant to not own a pucca house anywhere in India."
            )
        else:
            criteria_matched.append("Citizen does not own a pucca house, meeting housing assistance criteria.")

    # 8. Income Tax Payer Exclusion (tax_payer_allowed: False)
    tax_allowed = criteria.get("tax_payer_allowed")
    if tax_allowed is False:
        if profile.is_tax_payer is None:
            missing_information.append("Income tax payer status is required to verify non-taxpayer exclusion.")
        elif profile.is_tax_payer is True:
            criteria_not_met.append("Citizen is an income tax payer, which is disqualified under scheme guidelines.")
        else:
            criteria_matched.append("Citizen is not an income tax payer, meeting statutory exclusion requirement.")

    # 9. Government Employee Exclusion (government_employees_allowed: False)
    govt_allowed = criteria.get("government_employees_allowed")
    if govt_allowed is False:
        if profile.is_government_employee is None:
            missing_information.append("Government employee status is required to verify public servant exclusion.")
        elif profile.is_government_employee is True:
            criteria_not_met.append("Serving or retired government employees and their families are excluded from this scheme.")
        else:
            criteria_matched.append("Citizen is not a government employee, meeting the non-public-servant criterion.")

    # Outcome computation via 3-valued logic
    if len(criteria_not_met) > 0:
        outcome = "does_not_meet_known_criteria"
        reasons = [f"Disqualified: {c}" for c in criteria_not_met]
        if missing_information:
            reasons.append(
                f"Additionally missing {len(missing_information)} fields: {'; '.join(missing_information)}"
            )
    elif len(missing_information) > 0:
        outcome = "needs_verification"
        reasons = [
            f"Satisfies {len(criteria_matched)} verified criteria, but requires {len(missing_information)} missing details before eligibility can be confirmed.",
            f"Required information: {'; '.join(missing_information)}",
        ]
    else:
        outcome = "meets_known_criteria"
        reasons = [
            f"Citizen satisfies all {len(criteria_matched)} verified statutory eligibility criteria defined for this scheme."
        ] + criteria_matched

    return SchemeEligibilityResult(
        scheme_id=scheme_id,
        scheme_title=scheme_title,
        category=category,
        outcome=outcome,
        reasons=reasons,
        criteria_matched=criteria_matched,
        criteria_not_met=criteria_not_met,
        missing_information=missing_information,
        official_portal_url=official_portal_url,
        verification_source=verification_source,
    )


def evaluate_all_schemes(
    schemes: List[Dict[str, Any]], profile: CitizenProfile
) -> EligibilityCheckResponse:
    """Evaluate a citizen profile across all schemes in the catalog."""
    evaluated_schemes: List[SchemeEligibilityResult] = []
    summary_counts: Dict[str, int] = {
        "meets_known_criteria": 0,
        "does_not_meet_known_criteria": 0,
        "needs_verification": 0,
    }

    for scheme in schemes:
        result = evaluate_single_scheme(scheme, profile)
        evaluated_schemes.append(result)
        summary_counts[result.outcome] = summary_counts.get(result.outcome, 0) + 1

    return EligibilityCheckResponse(
        total_schemes_evaluated=len(evaluated_schemes),
        summary=summary_counts,
        schemes=evaluated_schemes,
    )
