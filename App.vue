<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

/**
 * App 启动
 */
onLaunch(() => {
	console.log('App Launch')

	// 尝试从缓存恢复登录状态
	restoreAuthFromCache()

	// 初始化公共数据（如果还没有）
	initPublicData()
})

/**
 * App 显示
 */
onShow(() => {
	console.log('App Show')
})

/**
 * App 隐藏
 */
onHide(() => {
	console.log('App Hide')
})

/**
 * 从缓存恢复登录状态
 */
const restoreAuthFromCache = () => {
	// 延迟执行，确保 store 已经初始化
	// @ts-ignore
	nextTick(() => {
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

/**
 * 初始化公共数据（公共分类）
 */
const initPublicData = () => {
	// 延迟执行，确保 uniCloud 已就绪
	setTimeout(async () => {
		try {
			// 初始化公共分类
			// @ts-ignore
			const catRes = await uniCloud.callFunction({
				name: 'category',
				data: { action: 'init' }
			})
			if (catRes.result.code === 0) {
				console.log('公共分类初始化结果:', catRes.result.message)
			}
		} catch (e) {
			console.log('初始化公共数据失败（可能已初始化）:', e)
		}
	}, 2000)
}
</script>

<style>
	/*每个页面公共css */
</style>
