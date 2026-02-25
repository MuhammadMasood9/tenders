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

  const { 
    page = '1', 
    keyword = '', 
    tender_no = '', 
    closing_date = '', 
    tender_type = '', 
    procurement_category = '',
    tender_nature = ''
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
}
