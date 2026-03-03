<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')

			// 尝试从缓存恢复登录状态
			this.restoreAuthFromCache()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			/**
			 * 从缓存恢复登录状态
			 */
			restoreAuthFromCache() {
				// 延迟执行，确保 store 已经初始化
				this.$nextTick(() => {
					try {
						// 获取 Pinia store
						// @ts-ignore
						const app = getApp()
						if (app && app.globalData && app.globalData.store) {
							// Pinia store 在 globalData.store 中
							const pinia = app.globalData.store
							// 获取 user store
							const userStore = pinia._s.get(pinia._s.keys().find(k => k === 'user'))
							if (userStore) {
								userStore.RestoreFromCache()
									.then((restored) => {
										if (restored) {
											console.log('登录状态已恢复')
										}
									})
									.catch(() => {
										// 恢复失败，静默处理
									})
							}
						}
					} catch (e) {
						console.log('恢复登录状态失败:', e)
					}
				})
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
