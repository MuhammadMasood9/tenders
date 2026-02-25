
import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route to fetch tenders
  app.get("/api/tenders", async (req, res) => {
    const { 
      page = 1, 
      keyword = "", 
      tender_no = "", 
      closing_date = "", 
      tender_type = "", 
      procurement_category = "",
      tender_nature = ""
    } = req.query;

    const params = new URLSearchParams({
      page: page.toString(),
      keyword: keyword.toString(),
      tender_no: tender_no.toString(),
      closing_date: closing_date.toString(),
      tender_type: tender_type.toString(),
      procurement_category: procurement_category.toString(),
      tender_nature: tender_nature.toString()
    });

    const url = `https://epms.ppra.gov.pk/public/tenders/active-tenders?${params.toString()}`;

    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const tenders: any[] = [];

      $('table tbody tr').each((i, el) => {
        const row = $(el);
        const tenderNo = row.find('.tender-no strong').text().trim();
        const title = row.find('td:nth-child(3) strong').first().text().trim();
        const category = row.find('.badge').first().text().trim();
        const organization = row.find('.tender-org').text().trim();
        const location = row.find('i.ri-map-pin-line').parent().text().trim();
        const type = row.find('.tender-badge').text().trim();
        const publishedDate = row.find('td:nth-child(5)').text().trim();
        const closingDate = row.find('td:nth-child(6) strong').text().trim();
        const closingTime = row.find('td:nth-child(6) small').text().trim();
        const detailsLink = row.find('a[href*="tender-details"]').attr('href');

        if (tenderNo) {
          tenders.push({
            tenderNo,
            title,
            category,
            organization,
            location,
            type,
            publishedDate,
            closingDate,
            closingTime,
            detailsLink: detailsLink ? `https://epms.ppra.gov.pk${detailsLink}` : null
          });
        }
      });

      // Extract pagination info
      const paginationText = $('.pagination-custom').text();
      const currentPage = parseInt($('.pagination-custom .active').text()) || 1;
      
      res.json({
        tenders,
        pagination: {
          currentPage,
          hasMore: $('.pagination-custom a:contains("Next")').length > 0
        }
      });
    } catch (error) {
      console.error("Error fetching tenders:", error);
      res.status(500).json({ error: "Failed to fetch tenders" });
    }
  });

  // API route to fetch tender details
  app.get("/api/tenders/details/:id", async (req, res) => {
    const { id } = req.params;
    const url = `https://epms.ppra.gov.pk/public/tenders/tender-details/${id}`;

    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const details: any = {
        tenderNo: id,
        title: $('h1').text().trim(),
        organization: {},
        tenderInfo: {},
        dates: {},
        corrigendum: [],
        documents: {}
      };

      // Extract Download Links
      $('a[href*="/pdf?file="]').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = `https://epms.ppra.gov.pk${href}`;
          if (text.includes('tender document')) {
            details.documents.tenderDocument = fullUrl;
          } else if (text.includes('advertisement')) {
            details.documents.advertisement = fullUrl;
          }
        }
      });

      // Organization Details
      $('.detail-card').each((i, el) => {
        const title = $(el).find('.section-title').text().trim();
        if (title.includes('Organization')) {
          $(el).find('li').each((j, li) => {
            const label = $(li).find('.detail-label').text().trim().replace(':', '');
            const value = $(li).find('.detail-value').text().trim();
            if (label && value) details.organization[label] = value;
          });
        } else if (title.includes('Tender Information')) {
          $(el).find('.list-group-item').each((j, li) => {
            const label = $(li).find('.detail-label').text().trim();
            const value = $(li).find('.flex-grow-1').text().trim();
            if (label && value) details.tenderInfo[label] = value;
          });
          details.tenderInfo['Note'] = $(el).find('h6:contains("Note")').next().text().trim();
          details.tenderInfo['Remarks'] = $(el).find('h6:contains("Remarks")').next().text().trim();
        } else if (title.includes('Important Dates')) {
          $(el).find('.list-group-item').each((j, li) => {
            const label = $(li).find('.detail-label').text().trim();
            const value = $(li).find('.flex-grow-1').text().trim();
            if (label && value) details.dates[label] = value;
          });
        }
      });

      // Corrigendum
      $('.badge-corrigendum').each((i, el) => {
        // Just a flag for now
        details.hasCorrigendum = true;
      });

      res.json(details);
    } catch (error) {
      console.error("Error fetching tender details:", error);
      res.status(500).json({ error: "Failed to fetch tender details" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
