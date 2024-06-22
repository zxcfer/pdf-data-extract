import os
from PyPDF2 import PdfReader, PdfWriter

# dir_path = 'D:/tmp/pdfs/'
# extension = '.pdf'

# files = os.listdir(dir_path)
# pdfs = [file for file in files if os.path.splitext(file)[1] == extension]

# # Print the list of matching files
# print(pdfs)

# file_name = r'D:\*'
# pages = (121, 130)

import os
from PyPDF2 import PdfReader, PdfWriter

dir_path = 'D:/tmp/pdfs/'  # Directory containing PDFs
extension = '.pdf'

files = os.listdir(dir_path)
pdfs = [file for file in files if os.path.splitext(file)[1] == extension]

for pdf in pdfs:
    reader = PdfReader(os.path.join(dir_path, pdf))
    for i in range(len(reader.pages)):
        writer = PdfWriter()
        writer.add_page(reader.pages[i])
        output_filename = f"{os.path.splitext(pdf)[0]}_page_{i+1}.pdf"
        with open(os.path.join(dir_path, output_filename), 'wb') as output_pdf:
            writer.write(output_pdf)

# Print the list of matching files
print(pdfs)
