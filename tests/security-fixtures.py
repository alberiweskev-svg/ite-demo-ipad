from pathlib import Path
import os,tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
root=Path(os.environ.get('ITE_TEST_OUTPUT',str(Path(tempfile.gettempdir())/'ite-security-tests')));root.mkdir(parents=True,exist_ok=True)
pdf=canvas.Canvas(str(root/'fattura-test.pdf'),pagesize=A4)
for i,line in enumerate(['Fattura n. PDF-TEST-001','DATI FITTIZI - NON VALIDI','Cedente / Prestatore','I.T.E. di Merkaj Alban','P.IVA: 03857941201','Cessionario / Committente','Denominazione: [TEST] Carlo Collaudo','Codice fiscale: TESTCF0000000001','Data: 15/01/2026','Totale imponibile: 100,00','Totale IVA: 22,00','Totale documento: 122,00']):pdf.drawString(50,800-i*26,line)
pdf.save()
