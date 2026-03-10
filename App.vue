<script setup lang="ts">
import { nextTick } from 'vue'
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from './store/user'

// 在顶层获取 user store（这是 Vue 3 Composition API 的推荐方式）
const userStore = useUserStore()

/**
 * App 启动
 */
onLaunch(() => {
	console.log('App Launch')

	// 延迟执行，确保 store 已经初始化
	setTimeout(() => {
		restoreAuthFromCache()
	}, 100)

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
	if (userStore) {
		userStore.RestoreFromCache()
			.then((restored: boolean) => {
				if (restored) {
					console.log('[App] 登录状态已恢复')
				}
			})
			.catch(() => {
				// 恢复失败，静默处理
			})
	}
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
/* 通用样式类 */
@import '@/styles/common.css';

/* 全局通用样式 */
page {
  background-color: #f7f8fa;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
}

/* 清除默认样式 */
view, text, button, input, textarea {
  box-sizing: border-box;
}

button {
  padding: 0;
  margin: 0;
  border: none;
  background: none;
}

button::after {
  border: none;
}

input, textarea {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}
</style>
