/** @type {import('next').NextConfig} */
const nextConfig = {
	// no output: 'export', no rewrites
	// Ensure static files are served correctly
	async rewrites() {
		return [
			{
				source: '/draft-analyzer-new.html',
				destination: '/draft-analyzer-new.html',
			},
			{
				source: '/pre-draft-cheat-sheet.html',
				destination: '/pre-draft-cheat-sheet.html',
			},
		];
	},
};

export default nextConfig; 