<template>
  <div id="app">
		<el-container>
			<el-header>Header</el-header>
			<el-container>
				<el-aside>
					<Sidebar/>
				</el-aside>
				<el-main>
					<UserForm/>
				</el-main>
			</el-container>
		</el-container>
  </div>
</template>

<script>
import UserForm from "./components/UserForm.vue";
import Sidebar from "./components/Sidebar.vue";

export default {
  name: 'app',
  components: {
		UserForm,
		Sidebar
  }
}
</script>

<style>
body {
	margin: 0;
}
#app {
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
