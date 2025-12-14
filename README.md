# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e28dd701-8d36-40f6-b3d1-84267b43b917

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e28dd701-8d36-40f6-b3d1-84267b43b917) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e28dd701-8d36-40f6-b3d1-84267b43b917) and click on Share -> Publish.

## Stackblitz / BOLT bootstrap workflow

Stackblitz WebContainers time out if they need to install the entire dependency graph up front. To get the project imported quickly, we ship a trimmed manifest at `package.bootstrap.json`. Use it only for the bootstrap step, then switch back to the full `package.json`.

1. **Before importing**  
   ```powershell
   Copy-Item package.bootstrap.json package.json
   npm install
   ```
   Push/zip the repo (without committing the temporary package change) or trigger the Stackblitz import directly.

2. **Inside Stackblitz once the container is ready**  
   ```bash
   git checkout -- package.json   # restore the real manifest
   npm install                    # install the full dependency set
   npm run dev
   ```

3. **Important** – never commit the bootstrap copy of `package.json`. The full manifest in source control remains authoritative; the bootstrap file only exists to get Stackblitz past its 30‑second install window.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
