<template>
  <div id="app">
		<el-container>
			<el-main>
				<UserForm/>
			</el-main>
		</el-container>
  </div>
</template>

<script>
import UserForm from "./components/UserForm.vue";

export default {
  name: 'app',
  components: {
    UserForm
  }
}
</script>

<style>
#app {
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
