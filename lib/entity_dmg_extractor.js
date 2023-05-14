const WikiTextParser = require('parse-wikitext')
const fs = require('fs')

const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')

function getText (rawText) {
  return rawText
    .replace(/\[\[(?:.+?\|)?(.+?)\]\]/g, '$1') // remove links
    .replace(/\(.+\)/g, '') // remove text in parenthesis
    .replace(/^(.+)<br \/>.+$/, '$1') // keep only the first line if two lines
    .trim()
}

function toProperCase(str) {
    return str.toLowerCase().replace(/\b\w/g, function(word) {
        return word.toUpperCase();
    });
}

module.exports = { writeAllEntities: writeAllEntities, getEntityDmg: getEntityDmg }

function getEntityDmg (date, cb) {  
  wikiTextParser.getFixedArticle('Damage/Mobs', date, function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const sectionObject = wikiTextParser.pageToSectionObject(data)
    const dmgText = sectionObject.content
    const entitiesDmg = {}
    let currentType = ''
    let currentLine = ''
    dmgText.reduce((acc, line) => {
      if (line.startsWith('|-') || line.startsWith('|}')) {
        acc.push(currentLine)
        currentLine = '| '
      } else {
        currentLine += line.replace(/^\| ?/, '') + ' || '
      }
      return acc
    }, [])
    .forEach(function (line) {
      if (line.startsWith('| ')) {
        if (line.startsWith('| colspan')) {
          currentType = line.split('|')[2].replace(/\|\|/, '').trim()
        } else {
          const values = line.split('||')
          const id = values[0].replace(/\| /g, '').trim()
          const normId = id.replace('! style="text-align:left" ', '')
          .replaceAll('{{', '')
          .replaceAll('}}', '')
          .replaceAll('EntityLink', '')
          .replaceAll('EntitySprite', '')
          .replaceAll('<br>')
          .split('|')        
          .filter(x=> !!x && x !=='')

          if (!id.includes("data-sort-type")) {
            const simpleId = normId.join("|").replace(/\(.*/, '').replace(/\|.*/, '').trim()
            const match = /\[\[([^\]]+)\]\]/.exec(simpleId)
            const extractedOrSimpleId = match ? match[0].replace('[[','').replace(']]', '') : simpleId
            entitiesDmg[normId] = {
              id: toProperCase(extractedOrSimpleId),
              description: normId,
              figures: values.slice(1).map(x=> getText(x)),
            }
          }
        }
      }
    })
    cb(null, Object.keys(entitiesDmg).map(function (key) { return entitiesDmg[key] }))
  })
}

function writeAllEntities (file, date, cb) {
    getEntityDmg(date, function (err, entities) {
    if (err) {
      cb(err)
      return
    }
    fs.writeFile(file, JSON.stringify(entities, null, 2), cb)
  })
}
