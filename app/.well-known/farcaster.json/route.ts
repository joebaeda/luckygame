export async function GET() {

    const config = {
        accountAssociation: {
            header: "eyJmaWQiOjg5MTkxNCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDRmYzg1YjUzN2FkYzE4RmYzNTRhMzJDNkUxM0JCRGNEZDk0YTZEMDEifQ",
            payload: "eyJkb21haW4iOiJsdWNreWdhbWUudmVyY2VsLmFwcCJ9",
            signature: "MHhkZDM0ZWExNTMwMWMyMWVhMDcyYmYxZmVlN2EyZjhjYWU4MGExZDBmMDViYmFjMmQ0YmI0NGU0MjI0ZDU5N2RlN2NhYmJlMmUwMjA5ZGU1MDdjOTZkZTcyMzljMGNiMDM5OWYxODYxNTBiMmQzZGZlMmUyNDY1MDYzMzkyNTBjZjFj"
        },
        frame: {
            version: "1",
            name: "Lucky Game",
            iconUrl: "https://luckygame.vercel.app/lucky-logo.jpg",
            homeUrl: "https://luckygame.vercel.app",
            imageUrl: "https://luckygame.vercel.app/og-image.jpg",
            buttonTitle: "Let's Spin",
            splashImageUrl: "https://luckygame.vercel.app/splash.png",
            splashBackgroundColor: "#17101f",
            webhookUrl: "https://luckygame.vercel.app/api/webhook"
        }
    };

    return Response.json(config);
}