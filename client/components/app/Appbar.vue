<template>
  <div class="w-full h-16 bg-primary relative">
    <div id="appbar" class="absolute top-0 bottom-0 left-0 w-full h-full px-2 md:px-6 py-1 z-60">
      <div class="flex h-full items-center">
        <nuxt-link to="/">
          <img src="~static/icon.svg" :alt="$strings.ButtonHome" class="w-8 min-w-8 h-8 mr-2 sm:w-10 sm:min-w-10 sm:h-10 sm:mr-4" />
        </nuxt-link>

        <nuxt-link to="/">
          <h1 class="text-xl mr-6 hidden lg:block hover:underline">audiobookshelf <span v-if="showExperimentalFeatures" class="material-icons text-lg text-warning pr-1">logo_dev</span></h1>
        </nuxt-link>

        <ui-libraries-dropdown class="mr-2" />

        <controls-global-search v-if="currentLibrary" class="mr-1 sm:mr-0" />
        <div class="flex-grow" />

        <widgets-notification-widget class="hidden md:block" />

        <ui-tooltip v-if="isChromecastInitialized && !isHttps" direction="bottom" text="Casting requires a secure connection" class="flex items-center">
          <span class="material-icons-outlined text-2xl text-warning text-opacity-50"> cast </span>
        </ui-tooltip>
        <div v-if="isChromecastInitialized" class="w-6 min-w-6 h-6 ml-2 mr-1 sm:mx-2 cursor-pointer">
          <google-cast-launcher></google-cast-launcher>
        </div>

        <nuxt-link v-if="currentLibrary" to="/config/stats" class="hover:text-gray-200 cursor-pointer w-8 h-8 hidden sm:flex items-center justify-center mx-1">
          <ui-tooltip :text="$strings.HeaderYourStats" direction="bottom" class="flex items-center">
            <span class="material-icons text-2xl" aria-label="User Stats" role="button">equalizer</span>
          </ui-tooltip>
        </nuxt-link>

        <nuxt-link v-if="userCanUpload && currentLibrary" to="/upload" class="hover:text-gray-200 cursor-pointer w-8 h-8 flex items-center justify-center mx-1">
          <ui-tooltip :text="$strings.ButtonUpload" direction="bottom" class="flex items-center">
            <span class="material-icons text-2xl" aria-label="Upload Media" role="button">upload</span>
          </ui-tooltip>
        </nuxt-link>

        <nuxt-link v-if="userIsAdminOrUp" to="/config" class="hover:text-gray-200 cursor-pointer w-8 h-8 flex items-center justify-center mx-1">
          <ui-tooltip :text="$strings.HeaderSettings" direction="bottom" class="flex items-center">
            <span class="material-icons text-2xl" aria-label="System Settings" role="button">settings</span>
          </ui-tooltip>
        </nuxt-link>

        <nuxt-link to="/account" class="relative w-9 h-9 md:w-32 bg-fg border border-gray-500 rounded shadow-sm ml-1.5 sm:ml-3 md:ml-5 md:pl-3 md:pr-10 py-2 text-left sm:text-sm cursor-pointer hover:bg-bg hover:bg-opacity-40" aria-haspopup="listbox" aria-expanded="true">
          <span class="items-center hidden md:flex">
            <span class="block truncate">{{ username }}</span>
          </span>
          <span class="h-full md:ml-3 md:absolute inset-y-0 md:right-0 flex items-center justify-center md:pr-2 pointer-events-none">
            <span class="material-icons text-xl text-gray-100">person</span>
          </span>
        </nuxt-link>
      </div>
      <div v-show="numMediaItemsSelected" class="absolute top-0 left-0 w-full h-full px-4 bg-primary flex items-center">
        <h1 class="text-lg md:text-2xl px-4">{{ $getString('MessageItemsSelected', [numMediaItemsSelected]) }}</h1>
        <div class="flex-grow" />
        <ui-btn v-if="!isPodcastLibrary && selectedMediaItemsArePlayable" color="success" :padding-x="4" small class="flex items-center h-9 mr-2" @click="playSelectedItems">
          <span class="material-icons text-2xl -ml-2 pr-1 text-white">play_arrow</span>
          {{ $strings.ButtonPlay }}
        </ui-btn>
        <ui-tooltip v-if="userIsAdminOrUp && isBookLibrary" :text="$strings.ButtonQuickMatch" direction="bottom">
          <ui-icon-btn :disabled="processingBatch" icon="auto_awesome" @click="batchAutoMatchClick" class="mx-1.5" />
        </ui-tooltip>
        <ui-tooltip v-if="isBookLibrary" :text="selectedIsFinished ? $strings.MessageMarkAsNotFinished : $strings.MessageMarkAsFinished" direction="bottom">
          <ui-read-icon-btn :disabled="processingBatch" :is-read="selectedIsFinished" @click="toggleBatchRead" class="mx-1.5" />
        </ui-tooltip>
        <ui-tooltip v-if="userCanUpdate && isBookLibrary" :text="$strings.LabelAddToCollection" direction="bottom">
          <ui-icon-btn :disabled="processingBatch" icon="collections_bookmark" @click="batchAddToCollectionClick" class="mx-1.5" />
        </ui-tooltip>
        <template v-if="userCanUpdate">
          <ui-tooltip :text="$strings.LabelEdit" direction="bottom">
            <ui-icon-btn :disabled="processingBatch" icon="edit" bg-color="warning" class="mx-1.5" @click="batchEditClick" />
          </ui-tooltip>
        </template>
        <ui-tooltip v-if="userCanDelete" :text="$strings.ButtonRemove" direction="bottom">
          <ui-icon-btn :disabled="processingBatch" icon="delete" bg-color="error" class="mx-1.5" @click="batchDeleteClick" />
        </ui-tooltip>
        <ui-tooltip :text="$strings.LabelDeselectAll" direction="bottom">
          <span class="material-icons text-4xl px-4 hover:text-gray-100 cursor-pointer" :class="processingBatch ? 'text-gray-400' : ''" @click="cancelSelectionMode">close</span>
        </ui-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      totalEntities: 0
    }
  },
  computed: {
    currentLibrary() {
      return this.$store.getters['libraries/getCurrentLibrary']
    },
    libraryName() {
      return this.currentLibrary ? this.currentLibrary.name : 'unknown'
    },
    libraryMediaType() {
      return this.currentLibrary ? this.currentLibrary.mediaType : null
    },
    isPodcastLibrary() {
      return this.libraryMediaType === 'podcast'
    },
    isBookLibrary() {
      return this.libraryMediaType === 'book'
    },
    isHome() {
      return this.$route.name === 'library-library'
    },
    user() {
      return this.$store.state.user.user
    },
    userIsAdminOrUp() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    username() {
      return this.user ? this.user.username : 'err'
    },
    numMediaItemsSelected() {
      return this.selectedMediaItems.length
    },
    selectedMediaItems() {
      return this.$store.state.globals.selectedMediaItems
    },
    selectedMediaItemsArePlayable() {
      return !this.selectedMediaItems.some((i) => !i.hasTracks)
    },
    userMediaProgress() {
      return this.$store.state.user.user.mediaProgress || []
    },
    userCanUpdate() {
      return this.$store.getters['user/getUserCanUpdate']
    },
    userCanDelete() {
      return this.$store.getters['user/getUserCanDelete']
    },
    userCanUpload() {
      return this.$store.getters['user/getUserCanUpload']
    },
    selectedIsFinished() {
      // Find an item that is not finished, if none then all items finished
      return !this.selectedMediaItems.find((item) => {
        const itemProgress = this.userMediaProgress.find((lip) => lip.libraryItemId === item.id)
        return !itemProgress || !itemProgress.isFinished
      })
    },
    processingBatch() {
      return this.$store.state.processingBatch
    },
    showExperimentalFeatures() {
      return this.$store.state.showExperimentalFeatures
    },
    isChromecastEnabled() {
      return this.$store.getters['getServerSetting']('chromecastEnabled')
    },
    isChromecastInitialized() {
      return this.$store.state.globals.isChromecastInitialized
    },
    isHttps() {
      return location.protocol === 'https:' || process.env.NODE_ENV === 'development'
    }
  },
  methods: {
    async playSelectedItems() {
      this.$store.commit('setProcessingBatch', true)

      const libraryItemIds = this.selectedMediaItems.map((i) => i.id)
      const libraryItems = await this.$axios
        .$post(`/api/items/batch/get`, { libraryItemIds })
        .then((res) => res.libraryItems)
        .catch((error) => {
          const errorMsg = error.response.data || 'Failed to get items'
          console.error(errorMsg, error)
          this.$toast.error(errorMsg)
          return []
        })

      if (!libraryItems.length) {
        this.$store.commit('setProcessingBatch', false)
        return
      }

      const queueItems = []
      libraryItems.forEach((item) => {
        let subtitle = ''
        if (item.mediaType === 'book') subtitle = item.media.metadata.authors.map((au) => au.name).join(', ')
        else if (item.mediaType === 'music') subtitle = item.media.metadata.artists.join(', ')
        queueItems.push({
          libraryItemId: item.id,
          libraryId: item.libraryId,
          episodeId: null,
          title: item.media.metadata.title,
          subtitle,
          caption: '',
          duration: item.media.duration || null,
          coverPath: item.media.coverPath || null
        })
      })

      this.$eventBus.$emit('play-item', {
        libraryItemId: queueItems[0].libraryItemId,
        queueItems
      })
      this.$store.commit('setProcessingBatch', false)
      this.$store.commit('globals/resetSelectedMediaItems', [])
      this.$eventBus.$emit('bookshelf_clear_selection')
    },
    cancelSelectionMode() {
      if (this.processingBatch) return
      this.$store.commit('globals/resetSelectedMediaItems', [])
      this.$eventBus.$emit('bookshelf_clear_selection')
    },
    toggleBatchRead() {
      this.$store.commit('setProcessingBatch', true)
      const newIsFinished = !this.selectedIsFinished
      const updateProgressPayloads = this.selectedMediaItems.map((item) => {
        return {
          libraryItemId: item.id,
          isFinished: newIsFinished
        }
      })
      console.log('Progress payloads', updateProgressPayloads)
      this.$axios
        .patch(`/api/me/progress/batch/update`, updateProgressPayloads)
        .then(() => {
          this.$toast.success('Batch update success!')
          this.$store.commit('setProcessingBatch', false)
          this.$store.commit('globals/resetSelectedMediaItems', [])
          this.$eventBus.$emit('bookshelf_clear_selection')
        })
        .catch((error) => {
          this.$toast.error('Batch update failed')
          console.error('Failed to batch update read/not read', error)
          this.$store.commit('setProcessingBatch', false)
        })
    },
    batchDeleteClick() {
      const audiobookText = this.numMediaItemsSelected > 1 ? `these ${this.numMediaItemsSelected} items` : 'this item'
      const confirmMsg = `Are you sure you want to remove ${audiobookText}?\n\n*Does not delete your files, only removes the items from Audiobookshelf`
      if (confirm(confirmMsg)) {
        this.$store.commit('setProcessingBatch', true)
        this.$axios
          .$post(`/api/items/batch/delete`, {
            libraryItemIds: this.selectedMediaItems.map((i) => i.id)
          })
          .then(() => {
            this.$toast.success('Batch delete success!')
            this.$store.commit('setProcessingBatch', false)
            this.$store.commit('globals/resetSelectedMediaItems', [])
            this.$eventBus.$emit('bookshelf_clear_selection')
          })
          .catch((error) => {
            this.$toast.error('Batch delete failed')
            console.error('Failed to batch delete', error)
            this.$store.commit('setProcessingBatch', false)
          })
      }
    },
    batchEditClick() {
      this.$router.push('/batch')
    },
    batchAddToCollectionClick() {
      this.$store.commit('globals/setShowBatchCollectionsModal', true)
    },
    setBookshelfTotalEntities(totalEntities) {
      this.totalEntities = totalEntities
    },
    batchAutoMatchClick() {
      this.$store.commit('globals/setShowBatchQuickMatchModal', true)
    }
  },
  mounted() {
    this.$eventBus.$on('bookshelf-total-entities', this.setBookshelfTotalEntities)
  },
  beforeDestroy() {
    this.$eventBus.$off('bookshelf-total-entities', this.setBookshelfTotalEntities)
  }
}
</script>

<style>
#appbar {
  box-shadow: 0px 5px 5px #11111155;
}
</style>
