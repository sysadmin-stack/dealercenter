# Meta Ads Custom Audience Guide — Florida Auto Center

## Overview

This guide explains how to use the exported CSV file to create a Custom Audience in Meta Ads Manager for retargeting FROZEN leads on Facebook and Instagram.

## Step 1: Export the CSV

1. Log into the DealerCenter dashboard
2. Go to **Leads** page
3. Click **Export Meta Audience** in the FROZEN leads card
4. A CSV file will download automatically
5. The file contains SHA-256 hashed emails and phone numbers (Meta-compliant)

## Step 2: Create Custom Audience in Meta

1. Go to [Meta Ads Manager](https://adsmanager.facebook.com)
2. Click **Audiences** in the left menu (or go to Business Settings > Audiences)
3. Click **Create Audience** > **Custom Audience**
4. Select **Customer list** as the source
5. Choose **Upload customer list manually**
6. Click **Next**

### Upload Settings

- **Customer list**: Upload the CSV file
- **Data mapping**: Meta should auto-detect the columns:
  - `email` → Email
  - `phone` → Phone Number
  - `fn` → First Name
  - `ln` → Last Name
  - `ct` → City
  - `st` → State
  - `country` → Country
- **Hashing**: Select "Data is already hashed" (SHA-256)
- **Audience name**: "Florida Auto Center - FROZEN Leads - [Date]"

7. Click **Upload & Create**
8. Wait for processing (usually 15-30 minutes)
9. Check match rate — expected: **60-70%** (~2,700 people from ~3,873 leads)

## Step 3: Create Retargeting Campaign

### Recommended Campaign Settings

| Setting | Value |
|---------|-------|
| **Objective** | Traffic or Leads |
| **Budget** | $5-10/day |
| **Duration** | 30 days |
| **Audience** | The Custom Audience created above |
| **Placements** | Facebook Feed, Instagram Feed, Instagram Stories |
| **Location** | Florida (or 50-mile radius from Orlando) |

### Creative Suggestions

**Option A: Video (Best performing)**
- 30-second walkthrough of current inventory
- End card: "Visit Florida Auto Center — Quality Used Vehicles"
- CTA: "Learn More" → website

**Option B: Carousel**
- 5 cards with most popular vehicles
- Each card: vehicle photo + year/make/model + price range
- CTA: "See Inventory"

**Option C: Single Image**
- Professional photo of the lot or a featured vehicle
- Overlay text: "New arrivals weekly"
- CTA: "Shop Now"

### Ad Copy Examples

**English:**
> Still looking for the right car? New arrivals hit our lot every week at Florida Auto Center. Quality vehicles, flexible financing, no-pressure experience. Come see us in Orlando!

**Portuguese:**
> Ainda procurando o carro certo? Novidades chegam toda semana na Florida Auto Center. Veiculos de qualidade, financiamento flexivel, sem pressao. Venha nos visitar em Orlando!

**Spanish:**
> Sigues buscando el carro perfecto? Nuevas llegadas cada semana en Florida Auto Center. Vehiculos de calidad, financiamiento flexible, sin presion. Visitanos en Orlando!

## Step 4: Monitor & Optimize

After 7 days:
- Check **Reach** and **Frequency** (aim for 2-3x frequency per person)
- Check **CTR** (Click-Through Rate) — aim for >1%
- Pause underperforming creatives
- Increase budget on winning ads

After 30 days:
- Export a new CSV with updated data
- Create a **Lookalike Audience** (1%) from people who engaged with your ads
- Run a new campaign targeting the Lookalike for prospecting

## Lookalike Audience (Advanced)

After 30 days of running the retargeting campaign:

1. Go to **Audiences** > **Create Audience** > **Lookalike Audience**
2. Source: Your Custom Audience
3. Location: Florida
4. Audience Size: 1% (most similar to your customers)
5. Use this Lookalike for prospecting campaigns to find new potential buyers

## Notes

- **Privacy**: All data in the CSV is SHA-256 hashed. Meta matches hashes against their user database — no raw PII is shared.
- **Refresh**: Re-export monthly to include new opt-outs and updated data.
- **Opt-outs**: The export automatically excludes opted-out leads.
- **Compliance**: This approach is CAN-SPAM and TCPA compliant as Meta handles ad delivery consent separately.
