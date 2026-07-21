# HomelinkGlobal Premium Property Marketplace Prototype

This is a professional evaluation prototype showing a realistic real estate and relocation marketplace workflow.

## Included pages

- `index.html` - homepage with search, featured listings, relocation services, supplier/listing journey, and user journey.
- `properties.html` - property search with filters for location, transaction type, property type, bedrooms, and price.
- `property.html` - property detail page with gallery, description, amenities, contact, and viewing request.
- `admin.html` - admin dashboard concept for listings, users, inquiries, bookings, service requests, and handover readiness.

## Real images

Run the included script from the project root before publishing:

```powershell
powershell -ExecutionPolicy Bypass -File .\download_real_property_images.ps1
```

This creates `assets/images/` and downloads real property images used by the prototype.

## Publish to GitHub Pages

```powershell
git add .
git commit -m "Upgrade HomelinkGlobal prototype with 12 listings and relocation workflows"
git push origin main
```

Live site:

```text
https://akilisleek.github.io/homelink-sample/
```

## Notes

The prototype is static for evaluation only. A production platform should use a secure backend, database, storage, authentication, payment integrations, monitoring, and handover documentation.


## Upgrade v3

This version adds clickable supplier onboarding and relocation service journeys. The service and supplier flows guide users through request details, review, and a payment-ready placeholder without processing payments in the prototype. Submitted demo requests appear in the admin concept dashboard through browser local storage.
