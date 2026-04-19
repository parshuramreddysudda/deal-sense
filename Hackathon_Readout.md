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
* **Executive Dashboard & Modular Tabs**: Built a sleek, "luxury PropTech" dark-themed UI featuring deal scores. We also explicitly componentized full standalone React views for **ESG Portfolio**, **Action Plan**, and **Reports**, demonstrating structural scalability.

---

## 2. What We Present Here (The Demo Flow)
When presenting to the judges/audience, execute the following script:

1. **Launch The App:** Open a `cmd.exe` terminal in the `initial-setup` directory and run `npm start` to concurrently spool up the backend and frontend.
2. **The Pitch (Homepage):** Introduce "DealSense ESG" as a board-ready platform that merges financial underwriting with stringent ESG risk data.
3. **Data Entry (The Form):** Walk through the **"Deal Analyser"** tab. Fill in a standard commercial asset (e.g., *Mindspace IT Park, Hyderabad*). Explain how real brokers input standard deal terms alongside core utilities and HVAC details. 
4. **The Reveal (Dashboard):** Hit **Analyse**. Watch the scores animate in. Emphasize that the risk score isn't just arbitrary; it mathematically blends the refinancing risk associated with the deal terms directly against poor CSRD (refrigerant) compliance gaps.
5. **The ROI (Action Plan):** Click over to the dedicated **Action Plan tab**. Show how DealSense has algorithmically extracted the proposed retrofits (e.g., Refrigerant Tracking Software), calculating literal dollar savings and payback periods in a clean, standalone view.
6. **The Hand-Off (Report Export):** Go back to the 'Deal Analyser' dashboard and click **Export Board Brief PDF**. Open the generated PDF to prove the platform natively yields board-reviewable artifacts. 
7. **Saved Reports:** Click the **Reports tab** to show how generated reports are logged and stored for subsequent asset manager underwritings.
8. **The Vision (Portfolio Tab):** Finally, click over to the **ESG Portfolio tab** to showcase the broader "Asset Manager" vision for multi-property tracking, highlighting the foundational tabular data layer we built.

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
