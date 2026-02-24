# rides/invoice.py

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
import os


def generate_invoice(file_path, booking):
    """
    Generates a PDF invoice for a booking
    """

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    content = []

    # 🔹 Title
    content.append(Paragraph("<b>RIDE INVOICE</b>", styles["Title"]))
    content.append(Spacer(1, 20))

    # 🔹 Booking Details
    content.append(Paragraph(f"<b>Booking ID:</b> {booking.id}", styles["Normal"]))
    content.append(Paragraph(f"<b>Date:</b> {booking.created_at.strftime('%d-%m-%Y %H:%M')}", styles["Normal"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph(f"<b>Pickup Location:</b> {booking.pickup_location_text}", styles["Normal"]))
    content.append(Paragraph(f"<b>Drop Location:</b> {booking.drop_location_text}", styles["Normal"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph(f"<b>Distance:</b> {booking.distance_km} km", styles["Normal"]))
    content.append(Paragraph(f"<b>Total Fare:</b> ₹ {booking.fare}", styles["Normal"]))
    content.append(Spacer(1, 12))

    # 🔹 Driver Details (optional)
    if booking.assigned_driver:
        content.append(Paragraph("<b>Driver Details</b>", styles["Heading2"]))
        content.append(Paragraph(
            f"Name: {booking.assigned_driver.user.username}", styles["Normal"]
        ))
        content.append(Paragraph(
            f"Vehicle No: {booking.assigned_driver.vehicle_number}", styles["Normal"]
        ))
        content.append(Spacer(1, 12))

    # 🔹 Footer
    content.append(Spacer(1, 20))
    content.append(Paragraph(
        "Thank you for riding with PathRider 🚕", styles["Italic"]
    ))

    # 📄 Build PDF
    doc.build(content)
