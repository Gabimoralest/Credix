from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib

# ── Cargar modelo, scaler y columnas ──
modelo   = joblib.load("modelo_credito.pkl")
scaler   = joblib.load("scaler_credito.pkl")
columnas = joblib.load("columnas_modelo.pkl")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


# ── Modelo de entrada — 6 campos del usuario (13 variables al modelo) ──
class DatosCredito(BaseModel):
    previous_loan_defaults: str   # "Yes" o "No"
    person_income: float
    loan_amnt: float
    loan_int_rate: float
    person_home_ownership: str    # "MORTGAGE","OWN","RENT","OTHER"
    loan_intent: str              # "EDUCATION","HOMEIMPROVEMENT","MEDICAL","PERSONAL","VENTURE","DEBTCONSOLIDATION"


@app.post("/predecir")
def predecir(datos: DatosCredito):

    # ── VALIDACION DE RANGOS ──
    if not (8000 <= datos.person_income <= 271262):
        return {"error": "Ingreso anual fuera de rango. Valores validos: $8,000 a $271,262."}
    if not (500 <= datos.loan_amnt <= 35000):
        return {"error": "Monto del prestamo fuera de rango. Valores validos: $500 a $35,000."}
    if datos.loan_amnt > datos.person_income:
        return {"error": "El monto del prestamo no puede ser mayor que el ingreso anual."}
    if not (5.42 <= datos.loan_int_rate <= 20):
        return {"error": "Tasa de interes fuera de rango. Valores validos: 5.42% a 20%."}

    # ── FEATURE ENGINEERING ──
    loan_percent_income            = datos.loan_amnt / datos.person_income
    person_income_log              = np.log1p(datos.person_income)
    loan_amnt_log                  = np.log1p(datos.loan_amnt)
    previous_loan_defaults_on_file = 1 if datos.previous_loan_defaults == "Yes" else 0

    home   = datos.person_home_ownership
    intent = datos.loan_intent

    person_home_ownership_OTHER = 1 if home == "OTHER" else 0
    person_home_ownership_OWN   = 1 if home == "OWN"   else 0
    person_home_ownership_RENT  = 1 if home == "RENT"  else 0

    loan_intent_EDUCATION       = 1 if intent == "EDUCATION"       else 0
    loan_intent_HOMEIMPROVEMENT = 1 if intent == "HOMEIMPROVEMENT" else 0
    loan_intent_MEDICAL         = 1 if intent == "MEDICAL"         else 0
    loan_intent_PERSONAL        = 1 if intent == "PERSONAL"        else 0
    loan_intent_VENTURE         = 1 if intent == "VENTURE"         else 0

    # ── ARMAR DATAFRAME ──
    fila = {
        "loan_int_rate":                  datos.loan_int_rate,
        "loan_percent_income":            loan_percent_income,
        "previous_loan_defaults_on_file": previous_loan_defaults_on_file,
        "person_income_log":              person_income_log,
        "loan_amnt_log":                  loan_amnt_log,
        "person_home_ownership_OTHER":    person_home_ownership_OTHER,
        "person_home_ownership_OWN":      person_home_ownership_OWN,
        "person_home_ownership_RENT":     person_home_ownership_RENT,
        "loan_intent_EDUCATION":          loan_intent_EDUCATION,
        "loan_intent_HOMEIMPROVEMENT":    loan_intent_HOMEIMPROVEMENT,
        "loan_intent_MEDICAL":            loan_intent_MEDICAL,
        "loan_intent_PERSONAL":           loan_intent_PERSONAL,
        "loan_intent_VENTURE":            loan_intent_VENTURE,
    }

    df = pd.DataFrame([fila])[columnas]

    # ── ESCALAR ──
    df_scaled = pd.DataFrame(scaler.transform(df), columns=columnas)

    # ── PREDECIR ──
    probabilidad = float(modelo.predict_proba(df_scaled)[0][1])
    aprobado     = probabilidad >= 0.5

    # ── NIVEL DE RIESGO ──
    if probabilidad >= 0.75:
        nivel = "MUY PROBABLE"
    elif probabilidad >= 0.5:
        nivel = "APROBADO"
    elif probabilidad >= 0.25:
        nivel = "RIESGO MODERADO"
    else:
        nivel = "RECHAZADO"

    return {
        "aprobado":     aprobado,
        "probabilidad": round(probabilidad * 100, 2),
        "nivel":        nivel,
        "regla_dura":   False,
        "motivo":       ""
    }
