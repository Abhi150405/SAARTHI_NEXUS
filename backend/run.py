import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    port = int(os.environ.get("PORT", 5000))
    # We use "app.main:app" because the app is in the 'app' folder and the object is named 'app'
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
