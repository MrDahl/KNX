# KNX TP Explorer — Educational Bus Analysis Tool v4.0

An interactive, responsive, and highly polished education-first web application designed for students, trainers, and engineers to explore the intricacies of the **KNX Twisted Pair (TP1)** physical layer, telegram framing, network topology limits, and standard Datapoint Types.

Based on the official instructional material and Tutor course syllabi provided by the **KNX Association**, this suite provides fully visualized simulation modules.

---

## 🚀 Interactive Modules

1. **Telegram Visualiser**
   - Interact with individual fields of a standard KNX bus frame (Control Field, Source Address, Destination Address, Routing Counter, Length, and APDU payload).
   - Automatically compile binary bit-level frames and hex conversions live.
   - Generate exact physical waveforms demonstrating active/blank state pulses (superimposed AC on DC bus) and parity validations.

2. **Topology Capacity Explorer**
   - Visualize classic hierarchical KNX systems (Areas, Lines, Segment couplers).
   - Simulate bus load configurations up to maximum capacities.
   - Calculate theoretical filtering tables, segment drop tables, and total data overhead parameters dynamically.

3. **Datapoint Types Matrix**
   - Complete lookup table of standardized KNX Datapoint Types (from DPT 1.xxx up to complex DPT 20.xxx fields).
   - Formats, resolutions, typical physical values, and standard engineering units.

4. **Training Handbook**
   - Clean, beautifully organized reference text detailing key physical parameters: CSMA/CA bus arbitrations, collision management, voltage modulation spikes, and transmission rates.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vite.dev/) (fast, modern front-end tooling)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (type-safe business logic)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (modern responsive spacing and utility structure)
- **Animations**: [Motion](https://motion.dev/) (fluid, hardware-accelerated user interaction transitions)
- **Icons**: [Lucide React](https://lucide.dev/) (consistent, crisp vector figures)

---

## 💻 Local Development

Follow these simple steps to run and build the application on your computer:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### 2. Install Dependencies
Clone/unzip the project folder, open your terminal inside, and install the package modules:
```bash
npm install
```

### 3. Run Development Server
Boot up the fast local development server:
```bash
npm run dev
```
Open your browser and navigate to the displayed host URL (typically `http://localhost:3000` or `http://localhost:5173`).

### 4. Production Build
Compile a highly optimized static bundle into the `dist/` workspace:
```bash
npm run build
```

---

## 📦 Pushing to GitHub & Deploying to GitHub Pages

Since your repository name is **https://github.com/MrDahl/KNX**, the application has been optimized to compile automatically for your personal URL space at `https://mrdahl.github.io/KNX/`.

### 1. Initialize Git and Push to GitHub
If you haven't initialized your Git repository locally, run the following commands in the project folder to set up and push your code:

```bash
# Initialize local git directory
git init

# Add all files to staging
git add .

# Create the initial commit
git commit -m "feat: Initial KNX Explorer application and deployment setup"

# Create/rename your primary branch to 'main'
git branch -M main

# Add your official GitHub repository target
git remote add origin https://github.com/MrDahl/KNX.git

# Push your files up to the remote host
git push -u origin main
```

### 2. Activate Automated GitHub Pages (GitHub Actions)
Rather than manually managing complex deployment branches, this project uses the modern, official **GitHub Actions** deployment pipeline.

To activate the automated deployment:
1. Open your web browser and go to your GitHub repository: **`https://github.com/MrDahl/KNX`**
2. Click on the **Settings** tab at the top.
3. In the sidebar on the left, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** -> **Source**, change the dropdown from **Deploy from a branch** to **GitHub Actions**.

✨ **That is it!** 

On your next push (or immediately upon configuring the settings), GitHub will trigger the `.github/workflows/deploy.yml` workflow, build your Vite React app, and deploy it straight to your live site at: **https://mrdahl.github.io/KNX/**

---

*Designed and maintained by Marc Sonne Dahl © 2026. Made for automation students and instructors of home and building control standards.*
