import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'],
        },
        // Replace with your actual production domain
        sitemap: 'https://murphys-users.vercel.app/sitemap.xml',
    }
}
