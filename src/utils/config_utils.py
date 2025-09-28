from pymongo import MongoClient

def get_save_paths():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["autodochub_db"]
        config_collection = db.config
        
        config = config_collection.find_one({}, sort=[('_id', -1)])
        if config and 'savePaths' in config:
            return config['savePaths']
        return {"orcamentos": r"D:\general_data\orcamentos", "recibos": r"D:\general_data\recibos"}
    except:
        return {"orcamentos": r"D:\general_data\orcamentos", "recibos": r"D:\general_data\recibos"}