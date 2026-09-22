from pymongo import MongoClient
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from datetime import datetime
from src.asssets.quoteStyle import quouteStyle
from src.database.DatabaseManager import DatabaseManager
from src.classes.contact_paymentClass import ContactPaymentClass
import os
from src.classes.serviceClass import Service
from src.classes.quoteClass import Quote
from src.classes.receiptsClass import Receipt
