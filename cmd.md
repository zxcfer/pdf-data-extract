```bash
paddleocr --image_dir=demo.pdf --type=structure --recovery=true --use_pdf2docx_api=true
soffice --headless --convert-to txt:Text demo.docx
git commit -m "changed datetimeoffset and timestamps fields to datetime2"
```

