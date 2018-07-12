module.exports = {
	devServer: {
		hot: true,
		inline: true,
		proxy: {
			'/api': {
				target: 'http://localhost:5000',
				ws: true,
				changeOrigin: true
			},
			'/token': {
				target: 'http://localhost:5000',
				ws: true,
				changeOrigin: true
			}
		}
	}
}
