import csv
    
def get_values(row, typ):
    if typ == 'top':
        if len(row) == 5:
            market_rent_growth = row[2]
            market_rent_sf = row[3]
            vacancy_rate = row[4]
            return [market_rent_growth, market_rent_sf, vacancy_rate]
    else:
        inventory_rate = row[0]
        return [inventory_rate]
        
def get_table_data(table, typ):
    ini = '2024 Q1'
    mid = '2023 Q1'

    row24 = table[table.index(ini)+1:table.index(mid)]
    row23 = table[table.index(mid)+1:]

    y24 = get_values(row24, typ)
    y23 = get_values(row23, typ)

    return y24, y23

def get_sector_data(sector):
    ini = 'Vacancy Rate'
    mid = 'Inventory SF'
    # end = 'Market Cap Rate'
    if mid not in sector:
        mid = 'Inventory Units'

    table_top = sector[sector.index(ini):sector.index(mid)]
    table_bottom = sector[sector.index(mid):]

    top24, top23 = get_table_data(table_top, 'top')
    bottom24, bottom23 = get_table_data(table_bottom, 'bottom')

    return top24 + bottom24, top23 + bottom23

def extract_from_txt(file_name):
    office = '1. Office'
    multif = '2. Multifamily'
    retail = '3. Retail'
    indus = '4. Industrial'

    sections = []
    with open(file_name, 'r') as file:
        lines = file.readlines()
        lines = [e.replace('\n', '').strip() for e in lines if e != '']
        lines = list(filter(None, lines))
        
        sections.append(['office']+lines[lines.index(office):lines.index(multif)])
        # sections.append(['multif']+lines[lines.index(multif):lines.index(retail)])
        # sections.append(['retail']+lines[lines.index(retail):lines.index(indus)])
        # sections.append(['industrial']+lines[lines.index(indus):])
    
    # CSV
    # city, state, sector, quarter, market_rent_growth, market_rent_sf, vacancy_rate, inventory_sf
    # Abilene, TX, Office, 2024 Q1, 1.9%, $16, 12,3%, 123,122,121
    # Abilene, TX, Office, 2023 Q1, 3.6%, $15, 12,3%, 123,122,121
    with open('d:/tmp/demo.csv', 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)

        for section in sections:
            city = 'fer'
            state = 'fer'
            y23, y24 = get_sector_data(section)

            csv_writer.writerow([city, state, section[0]] + y24)
            csv_writer.writerow([city, state, section[0]] + y23)

    return "Character not found in the file"

file_name = "D:/tmp/demo.txt"
result = extract_from_txt(file_name)
print(result)
