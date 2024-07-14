def search_and_get_next_line(file_name, character):
    office = '1. Office'
    multif = '2. Multifamily'
    retail = '3. Retail'
    indus = '4. Industrial'

    with open(file_name, 'r') as file:
        lines = file.readlines()

        content = lines.split(office)[1]

        resto = content.split(multif)[1]
        office = resto[0]
        
        resto = resto.split(retail)[1]
        multif = resto[0]

        resto = resto.split(indus)[-1]
        retail = resto[0]
        indus = resto[1]

        for i, line in enumerate(office):

            lines 

            office = []
            if office in line:

            if multif in line:

    return "Character not found in the file"

file_name = "demo.txt"
search = "2023 Q1"
result = search_and_get_next_line(file_name, search)
print(result)


# file to list
# divide list in sections | 1. Office | 2. Multifamily | 3. Retail | 4. Industrial
# divide section in subsections | stats1 | stats 2
# get 5 items
# validate if 5, if not get for format
# save the desired ones only
