# DealSense ESG – Hackathon Overview & Demo Plan

## 1. What We Did (Current State)
We successfully built a complete full-stack MERN-style web application (React/Vite + Node/Express) optimized for a seamless hackathon demonstration.

**Key Deliverables Built:**
* **Multi-Step Form (Broker Mode):** A dynamic form replacing standard OCR upload with comprehensive manual data inputs (Electricity kWh, Gas, HVAC usage, Refrigerants, Ratings, Deal Terms) ensuring robust offline/demo capabilities.
* **Proprietary Scoring Engine (Backend):** A deterministic NodeJS engine that dynamically computes:
   * **Carbon Footprint & Intensity**: Assessed strictly via Global Warming Potentials (GWPs), Grid intensity, and GLA.
   * **ESG Compliance (100pt scale)**: Evaluating data gap penalties, regulatory frameworks (CSRD), and energy rating impacts. 
   * **Deal Risk (100pt scale)**: Combining financial risk profiles (refinancing cliffs, LTV) with ESG gap penalties.
* **Prioritised Action Plan**: The system algorithmically proposes immediate actions (e.g., HVAC retrofit, LED enhancements) ordered by payback period and CO₂ elimination.
* **Dynamic Board Briefs (PDFs):** Integrated a backend `puppeteer` server capable of headless rendering the DealSense dashboard directly into a downloadable A4 PDF asset on request.
* **Executive Dashboard & Modular Tabs**: Built a sleek, "luxury PropTech" dark-themed UI relying on strict `Syne` and `DM Mono` typography. We extensively utilized **Recharts** to display complex Data visualization (10-yr ROI plots, ESG Donut charts, CRREM target bars). 
* **Seamless Landing & Demo States:** Built a dedicated `LandingPage` that intercepts users, displaying clear CBRE value props. We also implemented a `?demo=true` one-click seed feature that perfectly stages a board-ready dashboard instantly, eliminating risk of live-typing failures during the pitch.

---

## 2. What We Present Here (The Demo Flow)
When presenting to the judges/audience, execute the following script:

1. **Launch The App:** Open a `cmd.exe` terminal in the `initial-setup` directory and run `npm start` to concurrently spool up the backend and frontend.
2. **The Landing Page Pipeline:** Go to `localhost:5173`. You will land on the new DealSense ESG Landing page. Read out the value props (Risk in 60s, Auto-Compliance, Board-Ready output).
3. **The Speed-Run (One-Click Demo):** To impress upon speed, do NOT type out the form live. Simply click the **"View demo dashboard"** outline button. This executes our `?demo=true` payload injection, instantly seeding the form and transitioning to the Analyser dashboard with Mindspace IT Park, Hyderabad data.
4. **The Reveal (Dashboard):** Watch the SVG rings and progress bars animate in. Emphasize how the Risk Breakdown engine explicitly maps the refinancing risk directly against poor CSRD (refrigerant) compliance gaps.
5. **The ROI (Action Plan):** Click over to the dedicated **Action Plan tab**. Show the interactive **10-Year Cumulative Savings Line Chart** powered by Recharts, proving compound payback periods dynamically filtered by "Quick Wins" vs "Compliance-Driven" tasks.
6. **The Vision (Portfolio Tab):** Click over to the **ESG Portfolio tab** to showcase the "Asset Manager" scale. Display the Carbon vs CRREM horizontal bar chart, the ESG Health Heatmap, and the Donut breakdown of the full 5-asset portfolio.
7. **The Hand-Off (Report Export):** Go back to the 'Deal Analyser' tab and click **Export Board Brief PDF**. Open the generated PDF to prove the platform natively yields printable artifacts without breaking a sweat.
8. **Saved Reports Archive:** Briefly click the **Reports tab** to show how those generated reports are tracked lifetime, validating the platform's utility as a system of record.

---

## 3. What We Want To Do Later (Future Roadmap)
This serves as the core "V2 Setup" when speaking about future scalability.

### Azure AI Orchestration
* **Azure Document Intelligence**: Re-integrate OCR interpretation so users can literally drag-and-drop 500-page utility bills and receive formatted JSON energy consumption statistics without manual data-entry. 
* **Azure OpenAI (GPT-4o)**: Instead of formulaic string interpolations for the Executive Summary Narrative, feed the raw Carbon/Risk scores into the language model alongside a custom prompt to write highly-bespoke, nuanced investment briefings. 

### Live Market APIs
* **Automated Benchmarks**: Hook into active Federal Reserve / ECB / RBI APIs to pull daily live interest rate benchmarks instead of falling back to default states, making the Refinancing Risk calculations entirely autonomous.
* **Geospatial Processing**: Implement Azure Maps for geocoding input text directly to longitude/latitude, fetching region-specific carbon grid intensities dynamically (e.g., dynamically applying UK's `0.21` or India's `0.71` based on search). 

### Expanded Scale
* **True Asset Manager Mode**: Bridge our newly created `Portfolio.tsx` tab to properly digest CSVs of 100+ properties simultaneously, producing a dynamic heat-map of which assets to divest versus retrofit based on our Deal Risk algorithm.
