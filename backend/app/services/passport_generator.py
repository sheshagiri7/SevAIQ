"""SevAIQ Scheme Passport PDF Generator Service.

Generates a professional, downloadable SevAIQ Scheme Passport PDF
using ReportLab Platypus flowables and an in-memory BytesIO buffer.

Civic Intelligence Platform — Government Benefits. Made Accessible.
"""

import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.schemas import (
    CitizenProfile,
    DocumentMappingResponse,
    SchemeEligibilityResult,
)

# Page Layout Dimensions
PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN = 36.0
RIGHT_MARGIN = 36.0
TOP_MARGIN = 45.0
BOTTOM_MARGIN = 45.0
PRINTABLE_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN  # 523.2755 points

# Harmonious Civic Color Palette
COLOR_PRIMARY_DARK = colors.HexColor("#0F172A")    # Deep Slate / Navy
COLOR_NAVY_HEADING = colors.HexColor("#1E3A8A")    # Blue 900
COLOR_BRAND_BLUE = colors.HexColor("#2563EB")      # Blue 600
COLOR_BRAND_AMBER = colors.HexColor("#D97706")     # Amber 600
COLOR_ACCENT_GOLD = colors.HexColor("#F59E0B")     # Amber 500
COLOR_BG_LIGHT = colors.HexColor("#F8FAFC")        # Slate 50
COLOR_BORDER = colors.HexColor("#E2E8F0")          # Slate 200
COLOR_TEXT_MAIN = colors.HexColor("#1E293B")       # Slate 800
COLOR_TEXT_MUTED = colors.HexColor("#64748B")      # Slate 500

# Status & Outcome Colors
COLOR_SUCCESS_TEXT = colors.HexColor("#15803D")    # Green 700
COLOR_SUCCESS_BG = colors.HexColor("#DCFCE7")      # Green 100
COLOR_WARN_TEXT = colors.HexColor("#B45309")       # Amber 700
COLOR_WARN_BG = colors.HexColor("#FEF3C7")         # Amber 100
COLOR_DANGER_TEXT = colors.HexColor("#B91C1C")     # Red 700
COLOR_DANGER_BG = colors.HexColor("#FEE2E2")       # Red 100


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic total page numbering and running headers/footers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()

        # Running Top Header on page 2 and subsequent pages
        if self._pageNumber > 1:
            self.setFont("Helvetica", 7.5)
            self.setFillColor(COLOR_TEXT_MUTED)
            self.drawString(
                LEFT_MARGIN,
                PAGE_HEIGHT - 32,
                "SevAIQ Scheme Passport • Civic Intelligence & Application-Readiness",
            )
            self.drawRightString(
                PAGE_WIDTH - RIGHT_MARGIN,
                PAGE_HEIGHT - 32,
                "Informational Preparedness Assessment",
            )
            self.setStrokeColor(COLOR_BORDER)
            self.setLineWidth(0.5)
            self.line(LEFT_MARGIN, PAGE_HEIGHT - 36, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 36)

        # Running Bottom Footer on all pages
        self.setFont("Helvetica", 7.5)
        self.setFillColor(COLOR_TEXT_MUTED)
        self.drawString(
            LEFT_MARGIN,
            24,
            "SevAIQ Civic Intelligence • Informational Only • Not a Government Grant, Guarantee, or Approval",
        )
        self.drawRightString(
            PAGE_WIDTH - RIGHT_MARGIN,
            24,
            f"Page {self._pageNumber} of {page_count}",
        )
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(LEFT_MARGIN, 34, PAGE_WIDTH - RIGHT_MARGIN, 34)

        self.restoreState()


def break_url(url: str) -> str:
    """Insert zero-width break opportunities into long URLs to ensure safe wrapping."""
    if not url:
        return ""
    break_chars = {"/", ".", "-", "_", "?", "&", "=", "#", "%"}
    result = []
    for char in url:
        result.append(char)
        if char in break_chars:
            result.append("\u200b")
    return "".join(result)


def create_styles() -> Dict[str, ParagraphStyle]:
    """Define typography styles with proper fonts, sizes, and proportional leadings."""
    base_sheet = getSampleStyleSheet()

    styles = {
        "BannerTitle": ParagraphStyle(
            "BannerTitle",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=23,
            textColor=colors.white,
        ),
        "BannerSubtitle": ParagraphStyle(
            "BannerSubtitle",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#CBD5E1"),
        ),
        "BannerTag": ParagraphStyle(
            "BannerTag",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_ACCENT_GOLD,
        ),
        "BannerMetaTitle": ParagraphStyle(
            "BannerMetaTitle",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=COLOR_ACCENT_GOLD,
            alignment=2,  # Right aligned
        ),
        "BannerMetaText": ParagraphStyle(
            "BannerMetaText",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#F8FAFC"),
            alignment=2,
        ),
        "Disclaimer": ParagraphStyle(
            "Disclaimer",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10.5,
            textColor=colors.HexColor("#78350F"),
        ),
        "DisclaimerBold": ParagraphStyle(
            "DisclaimerBold",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#92400E"),
        ),
        "SectionHeader": ParagraphStyle(
            "SectionHeader",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=15,
            textColor=COLOR_NAVY_HEADING,
        ),
        "SectionSub": ParagraphStyle(
            "SectionSub",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10.5,
            textColor=COLOR_TEXT_MUTED,
        ),
        "TableCellLabel": ParagraphStyle(
            "TableCellLabel",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10.5,
            textColor=COLOR_PRIMARY_DARK,
        ),
        "TableCellValue": ParagraphStyle(
            "TableCellValue",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10.5,
            textColor=COLOR_TEXT_MAIN,
        ),
        "TableCellHeader": ParagraphStyle(
            "TableCellHeader",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10.5,
            textColor=COLOR_PRIMARY_DARK,
        ),
        "BodyText": ParagraphStyle(
            "BodyText",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=COLOR_TEXT_MAIN,
        ),
        "BodyTextBold": ParagraphStyle(
            "BodyTextBold",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=COLOR_TEXT_MAIN,
        ),
        "ScoreBig": ParagraphStyle(
            "ScoreBig",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=COLOR_BRAND_BLUE,
            alignment=1,  # Center
        ),
        "ScoreLabel": ParagraphStyle(
            "ScoreLabel",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=COLOR_PRIMARY_DARK,
            alignment=1,
        ),
        "ScoreFormula": ParagraphStyle(
            "ScoreFormula",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=7.5,
            leading=10,
            textColor=COLOR_TEXT_MUTED,
        ),
        "BadgeMeets": ParagraphStyle(
            "BadgeMeets",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_SUCCESS_TEXT,
            alignment=2,
        ),
        "BadgeNeeds": ParagraphStyle(
            "BadgeNeeds",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_WARN_TEXT,
            alignment=2,
        ),
        "BadgeFails": ParagraphStyle(
            "BadgeFails",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_DANGER_TEXT,
            alignment=2,
        ),
        "BulletMatched": ParagraphStyle(
            "BulletMatched",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10.5,
            textColor=COLOR_SUCCESS_TEXT,
        ),
        "BulletNotMet": ParagraphStyle(
            "BulletNotMet",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10.5,
            textColor=COLOR_DANGER_TEXT,
        ),
        "BulletMissing": ParagraphStyle(
            "BulletMissing",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10.5,
            textColor=COLOR_WARN_TEXT,
        ),
        "Citation": ParagraphStyle(
            "Citation",
            parent=base_sheet["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=COLOR_TEXT_MUTED,
        ),
        "StepNumber": ParagraphStyle(
            "StepNumber",
            parent=base_sheet["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=COLOR_BRAND_BLUE,
            alignment=1,
        ),
    }
    return styles


def build_header_flowable(styles: Dict[str, ParagraphStyle], report_ref: str, gen_date_str: str) -> Table:
    """Build the top SevAIQ branding and metadata header banner."""
    left_cell = [
        Paragraph("SevAIQ", styles["BannerTitle"]),
        Paragraph("Civic Intelligence & Application-Readiness Platform", styles["BannerSubtitle"]),
        Spacer(1, 2),
        Paragraph("Government Benefits. Made Accessible.", styles["BannerTag"]),
    ]

    right_cell = [
        Paragraph("SCHEME PASSPORT", styles["BannerMetaTitle"]),
        Paragraph(f"<b>Generated:</b> {gen_date_str}", styles["BannerMetaText"]),
        Paragraph(f"<b>Ref ID:</b> {report_ref}", styles["BannerMetaText"]),
        Paragraph("<b>Status:</b> Advisory Assessment", styles["BannerMetaText"]),
    ]

    header_table = Table([[left_cell, right_cell]], colWidths=[330.0, PRINTABLE_WIDTH - 330.0])
    header_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_PRIMARY_DARK),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    return header_table


def build_disclaimer_flowable(styles: Dict[str, ParagraphStyle]) -> Table:
    """Build the prominent statutory disclaimer callout."""
    disclaimer_text = [
        Paragraph(
            "<b>STATUTORY ADVISORY & APPLICATION-READINESS NOTICE:</b>",
            styles["DisclaimerBold"],
        ),
        Spacer(1, 2),
        Paragraph(
            "This SevAIQ Scheme Passport is an automated civic enablement assessment. "
            "It analyzes potential alignment with published government guidelines and maps documentation requirements based on self-reported citizen information. "
            "<b>This document does NOT constitute an official government benefit application, statutory entitlement, or confirmed approval.</b> "
            "No government application has been submitted by generating this report. Official verification, application processing, and final benefit disbursement rest solely with the competent Government Ministries, Departments, and nodal implementing agencies.",
            styles["Disclaimer"],
        ),
    ]

    disclaimer_table = Table([[disclaimer_text]], colWidths=[PRINTABLE_WIDTH])
    disclaimer_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_WARN_BG),
            ("BOX", (0, 0), (-1, -1), 1, COLOR_WARN_TEXT),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    return disclaimer_table


def build_citizen_summary_flowable(
    styles: Dict[str, ParagraphStyle], profile: CitizenProfile, notes: Optional[str]
) -> Table:
    """Build the sanitized citizen profile summary table."""
    age_str = f"{profile.age} years" if profile.age is not None else "Not specified"
    state_str = profile.state if profile.state else "All-India / Not specified"
    residence_str = profile.residence_type.title() if profile.residence_type else "Not specified"
    occ_str = profile.occupation.title() if profile.occupation else "Not specified"

    land_str = (
        "Yes (Cultivable Landholder)"
        if profile.owns_cultivable_land is True
        else ("No Cultivable Land" if profile.owns_cultivable_land is False else "Not specified")
    )
    pucca_str = (
        "Owns Pucca House"
        if profile.owns_pucca_house is True
        else ("No Pucca House" if profile.owns_pucca_house is False else "Not specified")
    )
    tax_str = (
        "Income Tax Payer"
        if profile.is_tax_payer is True
        else ("Non-Taxpayer" if profile.is_tax_payer is False else "Not specified")
    )
    govt_str = (
        "Government Employee"
        if profile.is_government_employee is True
        else ("Non-Govt Employee" if profile.is_government_employee is False else "Not specified")
    )

    income_str = (
        f"₹{int(profile.annual_income):,}"
        if profile.annual_income is not None
        else "Not declared"
    )
    docs_on_hand_str = f"{len(profile.available_documents)} document(s) declared on hand"

    col_w1 = 110.0
    col_w2 = 151.64
    col_w3 = 110.0
    col_w4 = PRINTABLE_WIDTH - (col_w1 + col_w2 + col_w3)

    rows = [
        [
            Paragraph("Age:", styles["TableCellLabel"]),
            Paragraph(age_str, styles["TableCellValue"]),
            Paragraph("State / UT:", styles["TableCellLabel"]),
            Paragraph(state_str, styles["TableCellValue"]),
        ],
        [
            Paragraph("Residence Area:", styles["TableCellLabel"]),
            Paragraph(residence_str, styles["TableCellValue"]),
            Paragraph("Primary Occupation:", styles["TableCellLabel"]),
            Paragraph(occ_str, styles["TableCellValue"]),
        ],
        [
            Paragraph("Agricultural Land:", styles["TableCellLabel"]),
            Paragraph(land_str, styles["TableCellValue"]),
            Paragraph("Pucca House Status:", styles["TableCellLabel"]),
            Paragraph(pucca_str, styles["TableCellValue"]),
        ],
        [
            Paragraph("Income Tax Status:", styles["TableCellLabel"]),
            Paragraph(tax_str, styles["TableCellValue"]),
            Paragraph("Public Servant Status:", styles["TableCellLabel"]),
            Paragraph(govt_str, styles["TableCellValue"]),
        ],
        [
            Paragraph("Annual Income:", styles["TableCellLabel"]),
            Paragraph(income_str, styles["TableCellValue"]),
            Paragraph("Declared Documents:", styles["TableCellLabel"]),
            Paragraph(docs_on_hand_str, styles["TableCellValue"]),
        ],
    ]

    if notes:
        rows.append([
            Paragraph("Evaluation Notes:", styles["TableCellLabel"]),
            Paragraph(notes, styles["TableCellValue"]),
            Paragraph("Privacy Standard:", styles["TableCellLabel"]),
            Paragraph("PII Masked; Zero Disk Persistence", styles["TableCellValue"]),
        ])

    table = Table(rows, colWidths=[col_w1, col_w2, col_w3, col_w4])
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_LIGHT),
            ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    return table


def build_readiness_scorecard(
    styles: Dict[str, ParagraphStyle], mapping: DocumentMappingResponse
) -> Table:
    """Build the document readiness percentage scorecard and transparent formula breakdown."""
    score = mapping.readiness_score.score_percentage
    num = mapping.readiness_score.numerator
    den = mapping.readiness_score.denominator
    formula = mapping.readiness_score.formula

    if score >= 75:
        score_color = COLOR_SUCCESS_TEXT
        badge_text = "High Document Preparedness"
        badge_bg = COLOR_SUCCESS_BG
    elif score >= 50:
        score_color = COLOR_WARN_TEXT
        badge_text = "Moderate Preparedness — Action Needed"
        badge_bg = COLOR_WARN_BG
    else:
        score_color = COLOR_DANGER_TEXT
        badge_text = "Needs Document Collection"
        badge_bg = COLOR_DANGER_BG

    left_cell = [
        Paragraph(f"<font color='{score_color.hexval()}'>{score}%</font>", styles["ScoreBig"]),
        Paragraph("DOCUMENT READINESS", styles["ScoreLabel"]),
        Spacer(1, 2),
        Paragraph(
            f"<font color='{score_color.hexval()}'><b>{badge_text}</b></font>",
            ParagraphStyle("BadgScore", parent=styles["ScoreLabel"], fontSize=7.5, leading=9.5),
        ),
    ]

    right_cell = [
        Paragraph(
            f"<b>Readiness Metric:</b> {num} of {den} distinct required documents currently available",
            styles["BodyTextBold"],
        ),
        Paragraph(f"<b>Formula:</b> {formula}", styles["ScoreFormula"]),
        Spacer(1, 3),
        Paragraph(
            f"• <b>Total Unique Documents Required:</b> {den} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"• <b>Available on Hand:</b> {len(mapping.available_documents)} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"• <b>Still Missing:</b> {len(mapping.missing_documents)}<br/>"
            f"• <b>Cross-Scheme Reusable Documents:</b> {len(mapping.reusable_documents)} "
            f"<i>(unblock 2+ schemes simultaneously)</i><br/>"
            f"• <b>Single-Scheme Specific Documents:</b> {len(mapping.single_scheme_documents)}",
            styles["BodyText"],
        ),
    ]

    scorecard_table = Table([[left_cell, right_cell]], colWidths=[140.0, PRINTABLE_WIDTH - 140.0])
    scorecard_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), COLOR_BG_LIGHT),
            ("BACKGROUND", (1, 0), (1, 0), colors.white),
            ("BOX", (0, 0), (-1, -1), 1, COLOR_BORDER),
            ("LINEBEFORE", (1, 0), (1, 0), 1, COLOR_BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    return scorecard_table


def build_scheme_evaluation_cards(
    styles: Dict[str, ParagraphStyle],
    eligibility_results: List[SchemeEligibilityResult],
    schemes_dict: Dict[str, Dict[str, Any]],
) -> List[Any]:
    """Build individual scheme cards detailing eligibility outcomes, rationale, criteria, and citations."""
    flowables: List[Any] = []

    for result in eligibility_results:
        scheme_info = schemes_dict.get(result.scheme_id, {})
        category = scheme_info.get("category", result.category)
        ministry = scheme_info.get("ministry", "Government of India")
        portal_url = result.official_portal_url or scheme_info.get("official_portal_url", "")
        citation = result.verification_source or scheme_info.get("verification_source", "Official Gazette Guidelines")

        # Outcome badge styling
        if result.outcome == "meets_known_criteria":
            badge_markup = "<font color='#15803D'>[ POTENTIAL MATCH: MEETS STATUTORY CRITERIA ]</font>"
            badge_style = styles["BadgeMeets"]
            card_border_color = COLOR_SUCCESS_TEXT
            card_bg_header = COLOR_SUCCESS_BG
        elif result.outcome == "needs_verification":
            badge_markup = "<font color='#B45309'>[ NEEDS VERIFICATION: MISSING DETAILS ]</font>"
            badge_style = styles["BadgeNeeds"]
            card_border_color = COLOR_WARN_TEXT
            card_bg_header = COLOR_WARN_BG
        else:
            badge_markup = "<font color='#B91C1C'>[ DOES NOT MEET KNOWN CRITERIA ]</font>"
            badge_style = styles["BadgeFails"]
            card_border_color = COLOR_DANGER_TEXT
            card_bg_header = COLOR_DANGER_BG

        # Scheme Header Row
        header_left = [
            Paragraph(f"<b>{result.scheme_title}</b>", styles["TableCellHeader"]),
            Paragraph(f"<font color='#64748B'>{category} • {ministry}</font>", styles["Citation"]),
        ]
        header_right = [Paragraph(badge_markup, badge_style)]

        # Details Content
        content_items = []

        # Rationale
        if result.reasons:
            content_items.append(Paragraph("<b>Evaluation Findings & Rationale:</b>", styles["TableCellLabel"]))
            for r in result.reasons:
                content_items.append(Paragraph(f"• {r}", styles["BodyText"]))
            content_items.append(Spacer(1, 3))

        # Matched Criteria
        if result.criteria_matched:
            content_items.append(Paragraph("<b>Statutory Criteria Satisfied:</b>", styles["TableCellLabel"]))
            for c in result.criteria_matched:
                content_items.append(Paragraph(f"✓ {c}", styles["BulletMatched"]))
            content_items.append(Spacer(1, 3))

        # Criteria Not Met
        if result.criteria_not_met:
            content_items.append(Paragraph("<b>Statutory Criteria Not Met / Disqualifications:</b>", styles["TableCellLabel"]))
            for c in result.criteria_not_met:
                content_items.append(Paragraph(f"✗ {c}", styles["BulletNotMet"]))
            content_items.append(Spacer(1, 3))

        # Missing Information
        if result.missing_information:
            content_items.append(Paragraph("<b>Information / Verification Needed to Confirm:</b>", styles["TableCellLabel"]))
            for m in result.missing_information:
                content_items.append(Paragraph(f"? {m}", styles["BulletMissing"]))
            content_items.append(Spacer(1, 3))

        # Official Source & Portal Link
        wrapped_url = break_url(portal_url) if portal_url else "Portal link under catalog indexing"
        link_markup = (
            f"<a href='{portal_url}'><font color='#2563EB'><u>{wrapped_url}</u></font></a>"
            if portal_url
            else wrapped_url
        )

        content_items.append(
            Paragraph(
                f"<b>Official Scheme Portal:</b> {link_markup}<br/>"
                f"<b>Verified Source Citation:</b> {citation}",
                styles["Citation"],
            )
        )

        # Build card as a single 2-row table wrapped in KeepTogether
        card_table = Table(
            [
                [header_left, header_right],
                [content_items, ""],
            ],
            colWidths=[340.0, PRINTABLE_WIDTH - 340.0],
        )
        card_table.setStyle(
            TableStyle([
                ("SPAN", (0, 1), (1, 1)),
                ("BACKGROUND", (0, 0), (1, 0), card_bg_header),
                ("BACKGROUND", (0, 1), (1, 1), colors.white),
                ("BOX", (0, 0), (-1, -1), 1, card_border_color),
                ("LINEBELOW", (0, 0), (1, 0), 0.5, card_border_color),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ])
        )

        flowables.append(KeepTogether([card_table, Spacer(1, 8)]))

    return flowables


def build_document_tables(
    styles: Dict[str, ParagraphStyle], mapping: DocumentMappingResponse
) -> List[Any]:
    """Build grouped tables for reusable documents, scheme-specific documents, and missing action items."""
    flowables: List[Any] = []

    # Column Widths
    col_w_doc = 160.0
    col_w_cat = 110.0
    col_w_schemes = 170.0
    col_w_status = PRINTABLE_WIDTH - (col_w_doc + col_w_cat + col_w_schemes)  # 83.28 pt

    # Section 4A: Reusable Documents
    flowables.append(
        Paragraph(
            "<b>4A. Reusable Cross-Scheme Documents (Required by 2 or More Schemes)</b>",
            styles["TableCellLabel"],
        )
    )
    flowables.append(
        Paragraph(
            "High-leverage records: preparing these documents satisfies multiple scheme applications at once.",
            styles["SectionSub"],
        )
    )
    flowables.append(Spacer(1, 3))

    if mapping.reusable_documents:
        rows_reusable = [
            [
                Paragraph("Canonical Document", styles["TableCellHeader"]),
                Paragraph("Category", styles["TableCellHeader"]),
                Paragraph("Schemes Requiring", styles["TableCellHeader"]),
                Paragraph("Status", styles["TableCellHeader"]),
            ]
        ]
        for doc in mapping.reusable_documents:
            status_markup = (
                "<font color='#15803D'><b>[ ✓ AVAILABLE ]</b></font>"
                if doc.status == "available"
                else "<font color='#B91C1C'><b>[ ✗ MISSING ]</b></font>"
            )
            schemes_str = f"{', '.join(doc.schemes_requiring)} ({doc.reusability_count} schemes)"
            rows_reusable.append([
                Paragraph(doc.canonical_name, styles["TableCellValue"]),
                Paragraph(doc.category, styles["TableCellValue"]),
                Paragraph(schemes_str, styles["TableCellValue"]),
                Paragraph(status_markup, styles["TableCellValue"]),
            ])

        table_reusable = Table(rows_reusable, colWidths=[col_w_doc, col_w_cat, col_w_schemes, col_w_status])
        table_reusable.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_BG_LIGHT),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        flowables.append(table_reusable)
    else:
        flowables.append(
            Paragraph("<i>No cross-scheme reusable documents required across selected schemes.</i>", styles["BodyText"])
        )

    flowables.append(Spacer(1, 8))

    # Section 4B: Scheme-Specific Documents
    flowables.append(
        Paragraph(
            "<b>4B. Single-Scheme Specific Documents (Required by 1 Scheme)</b>",
            styles["TableCellLabel"],
        )
    )
    flowables.append(
        Paragraph("Documents required specifically for individual schemes.", styles["SectionSub"])
    )
    flowables.append(Spacer(1, 3))

    if mapping.single_scheme_documents:
        rows_single = [
            [
                Paragraph("Canonical Document", styles["TableCellHeader"]),
                Paragraph("Category", styles["TableCellHeader"]),
                Paragraph("Target Scheme", styles["TableCellHeader"]),
                Paragraph("Status", styles["TableCellHeader"]),
            ]
        ]
        for doc in mapping.single_scheme_documents:
            status_markup = (
                "<font color='#15803D'><b>[ ✓ AVAILABLE ]</b></font>"
                if doc.status == "available"
                else "<font color='#B91C1C'><b>[ ✗ MISSING ]</b></font>"
            )
            schemes_str = ", ".join(doc.schemes_requiring)
            rows_single.append([
                Paragraph(doc.canonical_name, styles["TableCellValue"]),
                Paragraph(doc.category, styles["TableCellValue"]),
                Paragraph(schemes_str, styles["TableCellValue"]),
                Paragraph(status_markup, styles["TableCellValue"]),
            ])

        table_single = Table(rows_single, colWidths=[col_w_doc, col_w_cat, col_w_schemes, col_w_status])
        table_single.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_BG_LIGHT),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        flowables.append(table_single)
    else:
        flowables.append(
            Paragraph("<i>No single-scheme specific documents required.</i>", styles["BodyText"])
        )

    flowables.append(Spacer(1, 8))

    # Section 4C: Priority Missing Documents Action Checklist
    flowables.append(
        Paragraph(
            "<b>4C. Priority Action Items — Missing Documents Checklist</b>",
            styles["TableCellLabel"],
        )
    )
    flowables.append(
        Paragraph(
            "Actionable checklist of documents the citizen still needs to obtain before proceeding with application.",
            styles["SectionSub"],
        )
    )
    flowables.append(Spacer(1, 3))

    if mapping.missing_documents:
        missing_rows = [
            [
                Paragraph("Missing Document to Procure", styles["TableCellHeader"]),
                Paragraph("Category", styles["TableCellHeader"]),
                Paragraph("Unblocks Scheme(s)", styles["TableCellHeader"]),
                Paragraph("Action Required", styles["TableCellHeader"]),
            ]
        ]
        for doc in mapping.missing_documents:
            schemes_str = f"{', '.join(doc.schemes_requiring)} ({doc.reusability_count} schemes)"
            action_text = (
                "High Priority (Reusable across multiple schemes)"
                if doc.reusability_count >= 2
                else "Required for specific scheme submission"
            )
            missing_rows.append([
                Paragraph(f"<b>[ ]</b> {doc.canonical_name}", styles["TableCellValue"]),
                Paragraph(doc.category, styles["TableCellValue"]),
                Paragraph(schemes_str, styles["TableCellValue"]),
                Paragraph(action_text, styles["TableCellValue"]),
            ])

        table_missing = Table(missing_rows, colWidths=[col_w_doc, col_w_cat, col_w_schemes, col_w_status])
        table_missing.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_WARN_BG),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )
        flowables.append(table_missing)
    else:
        congrats_box = Table(
            [[
                Paragraph(
                    "<font color='#15803D'><b>ALL REQUIRED DOCUMENTS ARE AVAILABLE!</b> "
                    "The citizen has all unique documents needed across the selected schemes (100% Prepared).</font>",
                    styles["BodyText"],
                )
            ]],
            colWidths=[PRINTABLE_WIDTH],
        )
        congrats_box.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_SUCCESS_BG),
                ("BOX", (0, 0), (-1, -1), 1, COLOR_SUCCESS_TEXT),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        flowables.append(congrats_box)

    return flowables


def build_next_steps_flowable(styles: Dict[str, ParagraphStyle]) -> Table:
    """Build practical, step-by-step application roadmap for the citizen."""
    steps_content = [
        Paragraph("<b>PRACTICAL ROADMAP FOR CITIZEN WELFARE ACCESS:</b>", styles["TableCellHeader"]),
        Spacer(1, 3),
        Paragraph(
            "<b>1. Procure Missing Documents:</b> Focus first on high-reusability documents (e.g. Aadhaar Card, Bank Passbook linked to Aadhaar with NPCI mapper). These unblock multiple scheme applications simultaneously.",
            styles["BodyText"],
        ),
        Paragraph(
            "<b>2. Resolve Verification Criteria:</b> If any scheme outcome indicates 'Needs Verification', consult local revenue or municipal offices (e.g. Gram Panchayat, Tehsildar, or ULB ward office) to acquire verified land records (RoR) or updated income certificates.",
            styles["BodyText"],
        ),
        Paragraph(
            "<b>3. Apply via Official Government Channels:</b> Use the verified official portal URLs listed in Section 3 of this passport. Alternatively, visit your nearest authorized <b>Common Service Centre (CSC)</b> or Digital Seva Kendra for assisted online application submission.",
            styles["BodyText"],
        ),
        Paragraph(
            "<b>4. Secure Official Application Acknowledgment:</b> Always retain the official Application Reference Number, Acknowledgment Slip, or SMS confirmation provided by the portal or CSC for tracking application progress.",
            styles["BodyText"],
        ),
        Paragraph(
            "<b>5. Safeguard Personal Information:</b> Never pay unauthorized intermediaries or share confidential banking PINs/OTPs. Genuine government welfare subsidies and benefits are credited directly via DBT (Direct Benefit Transfer) into the citizen's Aadhaar-linked bank account.",
            styles["BodyText"],
        ),
    ]

    table = Table([[steps_content]], colWidths=[PRINTABLE_WIDTH])
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_LIGHT),
            ("BOX", (0, 0), (-1, -1), 1, COLOR_BRAND_BLUE),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    return table


def generate_scheme_passport_pdf(
    schemes: List[Dict[str, Any]],
    profile: CitizenProfile,
    eligibility_results: List[SchemeEligibilityResult],
    document_mapping: DocumentMappingResponse,
    notes: Optional[str] = None,
) -> io.BytesIO:
    """Generate the SevAIQ Scheme Passport PDF entirely in memory.
    
    Returns an in-memory BytesIO buffer containing the finalized PDF document.
    Does not persist citizen PII or report files to disk.
    """
    buffer = io.BytesIO()

    # Document Template with A4 dimensions and precise margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
    )

    styles = create_styles()
    story: List[Any] = []

    # Metadata & Timestamps
    now_utc = datetime.now(timezone.utc)
    gen_date_str = now_utc.strftime("%d %b %Y, %H:%M UTC")
    report_ref = f"SEQ-{now_utc.strftime('%Y%m%d')}-{abs(hash(tuple(s.get('id', '') for s in schemes))) % 100000:05d}"
    schemes_dict = {s.get("id", "").strip().lower(): s for s in schemes}

    # 1. SevAIQ Header Banner
    story.append(build_header_flowable(styles, report_ref, gen_date_str))
    story.append(Spacer(1, 6))

    # 2. Statutory Advisory Notice & Disclaimer
    story.append(build_disclaimer_flowable(styles))
    story.append(Spacer(1, 10))

    # 3. Citizen Profile Summary Section
    story.append(Paragraph("1. CITIZEN DEMOGRAPHIC & SOCIOECONOMIC SUMMARY", styles["SectionHeader"]))
    story.append(
        Paragraph(
            "Relevant eligibility attributes evaluated against verified statutory rules. Sensitive identifiers (Aadhaar number, banking credentials) are masked for privacy.",
            styles["SectionSub"],
        )
    )
    story.append(Spacer(1, 4))
    story.append(build_citizen_summary_flowable(styles, profile, notes))
    story.append(Spacer(1, 12))

    # 4. Document Preparedness & Readiness Metric
    story.append(Paragraph("2. DOCUMENT READINESS SCORECARD", styles["SectionHeader"]))
    story.append(
        Paragraph(
            "Consolidated readiness metric evaluating distinct required documents available to citizen across selected schemes.",
            styles["SectionSub"],
        )
    )
    story.append(Spacer(1, 4))
    story.append(build_readiness_scorecard(styles, document_mapping))
    story.append(Spacer(1, 12))

    # 5. Evaluated Schemes & Eligibility Breakdown
    story.append(Paragraph("3. SCHEME EVALUATION & EXPLAINABLE ELIGIBILITY OUTCOMES", styles["SectionHeader"]))
    story.append(
        Paragraph(
            "Transparent statutory evaluation of selected schemes with plain-English reasons, matched rules, and verification requirements.",
            styles["SectionSub"],
        )
    )
    story.append(Spacer(1, 4))
    scheme_cards = build_scheme_evaluation_cards(styles, eligibility_results, schemes_dict)
    story.extend(scheme_cards)
    story.append(Spacer(1, 6))

    # 6. Cross-Scheme Document Mapping & Actionable Checklist
    story.append(Paragraph("4. CROSS-SCHEME DOCUMENT MAPPING & ACTION CHECKLIST", styles["SectionHeader"]))
    story.append(
        Paragraph(
            "Consolidated document inventory identifying reusable records and targeted missing documents to obtain.",
            styles["SectionSub"],
        )
    )
    story.append(Spacer(1, 4))
    doc_sections = build_document_tables(styles, document_mapping)
    story.extend(doc_sections)
    story.append(Spacer(1, 12))

    # 7. Actionable Next Steps Roadmap
    story.append(Paragraph("5. NEXT STEPS & APPLICATION GUIDANCE", styles["SectionHeader"]))
    story.append(
        Paragraph(
            "Step-by-step guidance for completing official applications and obtaining government welfare benefits.",
            styles["SectionSub"],
        )
    )
    story.append(Spacer(1, 4))
    story.append(build_next_steps_flowable(styles))

    # Build PDF with dynamic NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)

    buffer.seek(0)
    return buffer
