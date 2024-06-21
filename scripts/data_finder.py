import csv

def get_parts(table):
    ini = '2024 Q1'
    mid = '2023 Q1'

    p1 = table[table.index(ini)+1:table.index(mid)]
    p2 = table[table.index(mid)+1:]

    get_values_top(p1)
    get_values_bottom(p2)

def get_sector_data(section):
    ini = 'Vacancy Rate'
    mid = 'Inventory SF'
    # end = 'Market Cap Rate'

    table_1 = section[section.index(ini):section.index(mid)]
    table_2 = section[section.index(mid):]

    get_parts(table_1)
    get_parts(table_2)

    return y23, y24
    
def get_values_top(section):
    if len(section) == 5:
        
        market_rent_growth = section[2]
        market_rent_growth = section[3]
        vacancy_rate = section[4]

def get_values_bottom(section):
    if len(section) == 5:
        value1 = section[0]

def search_and_get_next_line(file_name):
    office = '1. Office'
    multif = '2. Multifamily'
    retail = '3. Retail'
    indus = '4. Industrial'

    sections = []
    with open(file_name, 'r') as file:
        lines = file.readlines()
        lines = [e.replace('\n', '').strip() for e in lines if e != '']
        lines = list(filter(None, lines))
        
        sections.append(lines[lines.index(office):lines.index(multif)]) 
        sections.append(lines[lines.index(multif):lines.index(retail)])
        sections.append(lines[lines.index(retail):lines.index(indus)])
        sections.append(lines[lines.index(office)])
    
    with open('eggs.csv', 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)

    for section in sections:
        # quarter_data = {'market_rent_growth': None, 
        #                 'market_rent_sf': None,
        #                 'vacancy_rate': None,
        #                 'inventory_sf': None}, 
        # sector_data = {'2024 Q1': quarter_data.copy(),
        #                '2023 Q1': quarter_data.copy()}

        city = 'fer'
        state = 'fer'
        y23, y24 = get_sector_data(section)

        csv_writer.writerow([city, state, section] + y23)
        csv_writer.writerow([city, state, section] + y24)

    # CSV
    # city, state, sector, quarter, market_rent_growth, market_rent_sf, vacancy_rate, inventory_sf
    # Abilene, TX, Office, 2024 Q1, 1.9%, $16, 12,3%, 123,122,121
    # Abilene, TX, Office, 2023 Q1, 3.6%, $15, 12,3%, 123,122,121

    return "Character not found in the file"

file_name = "D:/tmp/demo.txt"
result = search_and_get_next_line(file_name)
print(result)

# file to list
# divide list in sections | 1. Office | 2. Multifamily | 3. Retail | 4. Industrial
# divide section in subsections | stats1 | stats 2
# get 5 items
# validate if 5, if not get for format
# save the desired ones only
