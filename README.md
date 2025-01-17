# mineral-ai

## Comprehensive Insights into Global Mineral Commodities: Analysis, Visualization, and Intelligent Assistance

**Website:** [mineral-ai.net](https://mineral-ai.net)

With the growing emphasis on sustainability, criticality, and availability in materials research, our study introduces a comprehensive data analytics platform to provide country-specific insights into global elemental production and reserves. Utilizing data from the United States Geological Survey (USGS), our web application incorporates the Herfindahl-Hirschman Index (HHI) to assess market concentration, identifying potential risks and opportunities related to resource availability.

The platform features an AI assistant powered by a Retrieval-Augmented Generation (RAG) system, leveraging the past ten years of USGS mineral commodities summaries. This system employs an open-source large language model (LLM) to enable users to query various aspects of raw materials, including reserves, production, market share, usage, price, substitutes, recycling, and more. By retrieving relevant documents and generating accurate, comprehensive responses, our tool addresses a crucial gap in publicly available resources, offering a unified application for detailed material analysis.

This platform provides valuable support for material scientists in assessing sustainability, criticality, and market risks, thereby aiding in the development of new materials.

---

## Getting Started

You can access the platform directly from the [website](https://mineral-ai.net) for an easy-to-use interface with all features available online.

Alternatively, if you prefer to run the application locally on your machine, follow the steps below to set it up. Running the application locally allows you to explore and customize its functionality.

### Prerequisites

- Python 3.9 or above
- Conda package manager

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/mineral-ai.git
   cd mineral-ai
   ```

2. **Create a Conda Environment:**
   ```bash
   conda create --name mineral_ai python=3.9
   ```

3. **Activate the Conda Environment:**
   ```bash
   conda activate mineral_ai
   ```

4. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set Up Hugging Face Access Token:**
   Navigate to `LLMResponse.py` and replace the value of the `huggingfacehub_api_token` variable on line 47 with your own Hugging Face API token.
   ```bash
   huggingfacehub_api_token = "your_huggingface_hub_access_token"
   ```

6. **Run the Application from the Terminal:**
   ```bash
   python app.py
   ```

7. **Open your browser and navigate to:**
   ```
   http://127.0.0.1:8080
   ```

### Features

1. **Data Visualization:**
   - Dynamic periodic table to explore element-specific data.
   - World map to analyze global production and reserves.

2. **Market Concentration Analysis:**
   - Herfindahl-Hirschman Index (HHI) integrated for assessing market risks.

3. **AI Assistant:**
   - Powered by Retrieval-Augmented Generation (RAG) and an open-source large language model (LLM).
   - Supports queries on reserves, production, market share, usage, price, substitutes, recycling, and more.

4. **Extensive Database:**
   - Incorporates data from the past ten years of USGS mineral commodities summaries.

### License

This project is licensed under the MIT License - see the LICENSE file for details.

### Feedback

For any questions or feedback, feel free to open an issue on GitHub or contact the maintainer.
