from pymongo import MongoClient
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from datetime import datetime
from src.asssets.quoteStyle import quouteStyle
from src.database.DatabaseManager import DatabaseManager
from src.classes.contact_paymentClass import ContactPaymentClass
import os
from src.classes.serviceClass import Service
from src.classes.quoteClass import Quote
