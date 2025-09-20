# AutodocHub

Automated quote and receipt generation system with PDF export functionality.

## Features

- **Quote Management**: Create, preview, and generate professional PDF quotes
- **Receipt Generation**: Convert quotes to receipts with editable fields
- **Real-time Preview**: Live preview updates as you edit
- **PDF Export**: Professional PDF generation with consistent styling
- **Data Persistence**: MongoDB integration for quote/receipt storage
- **Search & Filter**: Find quotes by client, address, or ID

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: MongoDB
- **PDF Generation**: ReportLab
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Installation

1. Clone the repository
2. Install dependencies: `pip install flask pymongo reportlab`
3. Start MongoDB service
4. Run the application: `python -m src.app`
5. Access at `http://localhost:5000`

## Project Structure

```
src/
├── app.py                 # Flask application
├── generatePDFParser.py   # Quote PDF generator
├── generateReceiptPDF.py  # Receipt PDF generator
├── classes/               # Data models
├── templates/             # HTML templates
├── static/                # CSS/JS files
└── asssets/               # PDF styling
```

## API Endpoints

- `GET /` - Main application
- `POST /api/orcamentos` - Create quote
- `GET /api/orcamentos` - List quotes
- `POST /api/recibos` - Generate receipt

## Documentation

[Detailed Documentation](https://www.notion.so/AutodocHub-23a0166bb9f6803195d5f5eb44f851b7?source=copy_link)