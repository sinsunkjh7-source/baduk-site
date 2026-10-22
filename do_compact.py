with open('baduk/index.html', 'r', encoding='utf-8') as fp:
    c = fp.read()

# Replace with compact size
c = c.replace('width: 230px; height: 230px;', 'width: 170px; height: 170px;')
c = c.replace('border-radius: 52px;', 'border-radius: 36px;')
c = c.replace('min-height: 250px; margin: 20px auto 30px;', 'min-height: 190px; margin: 10px auto 16px;')

with open('baduk/index.html', 'w', encoding='utf-8') as fp:
    fp.write(c)

print('Adjusted sizing!')
