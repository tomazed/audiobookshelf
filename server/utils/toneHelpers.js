const tone = require('node-tone')
const fs = require('../libs/fsExtra')
const Logger = require('../Logger')
const { secondsToTimestamp } = require('./index')

module.exports.writeToneChaptersFile = (chapters, filePath) => {
  var chaptersTxt = ''
  for (const chapter of chapters) {
    chaptersTxt += `${secondsToTimestamp(chapter.start, true, true)} ${chapter.title}\n`
  }
  return fs.writeFile(filePath, chaptersTxt)
}

module.exports.getToneMetadataObject = (libraryItem, chaptersFile) => {
  const coverPath = libraryItem.media.coverPath
  const bookMetadata = libraryItem.media.metadata

  const metadataObject = {
    'Title': bookMetadata.title || '',
    'Album': bookMetadata.title || '',
    'TrackTotal': libraryItem.media.tracks.length
  }
  const additionalFields = []

  if (bookMetadata.subtitle) {
    metadataObject['Subtitle'] = bookMetadata.subtitle
  }
  if (bookMetadata.authorName) {
    metadataObject['Artist'] = bookMetadata.authorName
    metadataObject['AlbumArtist'] = bookMetadata.authorName
  }
  if (bookMetadata.description) {
    metadataObject['Comment'] = bookMetadata.description
    metadataObject['Description'] = bookMetadata.description
  }
  if (bookMetadata.narratorName) {
    metadataObject['Narrator'] = bookMetadata.narratorName
    metadataObject['Composer'] = bookMetadata.narratorName
  }
  if (bookMetadata.firstSeriesName) {
    metadataObject['MovementName'] = bookMetadata.firstSeriesName
  }
  if (bookMetadata.firstSeriesSequence) {
    metadataObject['Movement'] = bookMetadata.firstSeriesSequence
  }
  if (bookMetadata.genres.length) {
    metadataObject['Genre'] = bookMetadata.genres.join('/')
  }
  if (bookMetadata.publisher) {
    metadataObject['Publisher'] = bookMetadata.publisher
  }
  if (bookMetadata.asin) {
    additionalFields.push(`ASIN=${bookMetadata.asin}`)
  }
  if (bookMetadata.isbn) {
    additionalFields.push(`ISBN=${bookMetadata.isbn}`)
  }
  if (coverPath) {
    metadataObject['CoverFile'] = coverPath
  }
  if (parsePublishedYear(bookMetadata.publishedYear)) {
    metadataObject['PublishingDate'] = parsePublishedYear(bookMetadata.publishedYear)
  }
  if (chaptersFile) {
    metadataObject['ChaptersFile'] = chaptersFile
  }

  if (additionalFields.length) {
    metadataObject['AdditionalFields'] = additionalFields
  }

  return metadataObject
}

module.exports.tagAudioFile = (filePath, payload) => {
  return tone.tag(filePath, payload).then((data) => {
    return true
  }).catch((error) => {
    Logger.error(`[toneHelpers] tagAudioFile: Failed for "${filePath}"`, error)
    return false
  })
}

function parsePublishedYear(publishedYear) {
  if (isNaN(publishedYear) || !publishedYear || Number(publishedYear) <= 0) return null
  return `01/01/${publishedYear}`
}