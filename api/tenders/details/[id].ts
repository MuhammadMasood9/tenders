import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid tender ID' });
  }

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
      details.hasCorrigendum = true;
    });

    res.json(details);
  } catch (error) {
    console.error("Error fetching tender details:", error);
    res.status(500).json({ error: "Failed to fetch tender details" });
  }
}
