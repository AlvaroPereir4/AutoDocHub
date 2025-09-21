# AutodocHub 📝

Professional automated quote and receipt generation system with advanced PDF export functionality and comprehensive configuration management.

## ✨ Features

### 📋 Core Functionality
- **Quote Management**: Create, preview, and generate professional PDF quotes
- **Receipt Generation**: Convert quotes to receipts with editable fields
- **Real-time Preview**: Live preview updates as you edit
- **PDF Export**: Professional PDF generation with consistent styling
- **Data Persistence**: MongoDB integration for quote/receipt storage
- **Search & Filter**: Find quotes by client, address, or ID

### ⚙️ Advanced Configuration System
- **Pre-forms Management**: Create reusable text templates for services and observations
- **Theme System**: Light, intermediate, and dark themes with smooth transitions
- **Color Palettes**: Multiple color schemes (Default, Blue, Green, Purple, Orange, Red)
- **Typography Control**: Adjustable font sizes (12-20px)
- **Personal Data Management**: Configurable user information (name, phone, email, PIX)
- **Collapsible Settings**: Organized configuration groups for better UX

### 🌐 Internationalization
- **Multi-language Support**: Portuguese and English interface
- **Dynamic Translation**: Real-time language switching
- **Persistent Language**: Saves language preference in database

### 🛡️ Security & Reliability
- **File Name Sanitization**: Automatic cleanup of special characters in generated files
- **Data Validation**: Comprehensive input validation and error handling
- **Safe PDF Generation**: Prevents file system issues with invalid characters

## 🚀 Tech Stack

- **Backend**: Flask (Python) with RESTful API
- **Database**: MongoDB with structured collections
- **PDF Generation**: ReportLab with custom styling
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Internationalization**: Custom translation system
- **Configuration**: Persistent settings with real-time application

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlvaroPereir4/AutoDocHub.git
   cd AutoDocHub
   ```

2. **Install dependencies**
   ```bash
   pip install flask pymongo reportlab
   ```

3. **Setup MongoDB**
   - Ensure MongoDB is running on `localhost:27017`
   - The application will automatically create the database and collections

4. **Run the application**
   ```bash
   python -m src.app
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:5000`

## 📁 Project Structure

```
src/
├── app.py                    # Flask application with API routes
├── generatePDFParser.py      # Quote PDF generator
├── generateReceiptPDF.py     # Receipt PDF generator
├── classes/
│   ├── configClass.py        # Configuration management
│   ├── quoteClass.py         # Quote data model
│   ├── receiptsClass.py      # Receipt data model
│   └── serviceClass.py       # Service data model
├── templates/
│   └── index.html           # Main application interface
├── static/
│   ├── script.js            # Application logic
│   ├── style.css            # Styling (embedded)
│   └── translations.js      # Internationalization
└── assets/
    ├── quoteStyle.py        # PDF quote styling
    └── receiptStyle.py      # PDF receipt styling
```

## 🗄️ Database Structure

The application uses MongoDB with the database `autodochub_db` containing three main collections:

### Collections

#### `config`
- **Purpose**: Stores application configuration settings
- **Contains**: 
  - Theme preferences (light/intermediate/dark)
  - Color palette settings
  - Font size configuration
  - Language preferences (pt-BR/en)
  - User personal data (name, phone, email, PIX)
  - Pre-forms for services and observations

#### `quote_docs`
- **Purpose**: Stores all generated quotes
- **Contains**:
  - Client information
  - Service details and pricing
  - Quote validity dates
  - Contact information
  - PDF file locations
  - Creation timestamps

#### `receipt_docs`
- **Purpose**: Stores all generated receipts
- **Contains**:
  - Receipt data based on quotes
  - Payment information (down payment, remaining balance)
  - Service completion details
  - PDF file locations
  - Creation timestamps

## 🔌 API Endpoints

### Core Operations
- `GET /` - Main application interface
- `POST /api/orcamentos` - Create new quote
- `GET /api/orcamentos` - List all quotes
- `POST /api/recibos` - Generate receipt from quote

### Configuration Management
- `GET /api/config` - Get current configuration
- `POST /api/config` - Save configuration settings

## 🎨 Configuration Options

### Themes
- **Light**: Clean white background with dark text
- **Intermediate**: Soft gray theme for reduced eye strain
- **Dark**: Full dark mode with light text

### Color Palettes
- **Default**: Classic gray accent
- **Blue**: Professional blue tones
- **Green**: Nature-inspired green
- **Purple**: Creative purple scheme
- **Orange**: Energetic orange highlights
- **Red**: Bold red accents

### Pre-forms
- **Services**: Reusable service descriptions
- **Observations**: Standard terms and conditions
- **Flexible Integration**: Insert and edit as needed

## 🌍 Language Support

- **Portuguese (pt-BR)**: Complete interface translation
- **English (en)**: Full English interface
- **Dynamic Switching**: Change language without restart
- **Persistent Settings**: Language preference saved automatically

## 📄 Documentation

[Detailed Documentation](https://www.notion.so/AutodocHub-23a0166bb9f6803195d5f5eb44f851b7?source=copy_link)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).