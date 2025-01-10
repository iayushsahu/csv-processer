const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const app = express();
const PORT = process.env.PORT || 3000;

// Create upload directories if they don't exist
const ordersDirectory = path.join(__dirname, 'order_csv');
const deliveryDirectory = path.join(__dirname, 'delivery_csv');

if (!fs.existsSync(ordersDirectory)) fs.mkdirSync(ordersDirectory);
if (!fs.existsSync(deliveryDirectory)) fs.mkdirSync(deliveryDirectory);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: ordersDirectory,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// State codes mapping
const indianStates = {
  'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar',
  'CG': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana',
  'HP': 'Himachal Pradesh', 'JH': 'Jharkhand', 'KA': 'Karnataka', 'KL': 'Kerala',
  'MP': 'Madhya Pradesh', 'MH': 'Maharashtra', 'MN': 'Manipur', 'ML': 'Meghalaya',
  'MZ': 'Mizoram', 'NL': 'Nagaland', 'OD': 'Odisha', 'PB': 'Punjab', 'RJ': 'Rajasthan',
  'SK': 'Sikkim', 'TN': 'Tamil Nadu', 'TG': 'Telangana', 'TR': 'Tripura', 'UP': 'Uttar Pradesh',
  'UK': 'Uttarakhand', 'WB': 'West Bengal', 'AN': 'Andaman and Nicobar Islands',
  'CH': 'Chandigarh', 'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'DL': 'Delhi', 'JK': 'Jammu and Kashmir', 'LA': 'Ladakh', 'LD': 'Lakshadweep', 'PY': 'Puducherry'
};

// File processing function
const processCSV = (filePath, outputFilePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');

  Papa.parse(fileContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (parsedData) => {
      const results = parsedData.data.map(data => {
        const saleOrderNumber = data.Name ? data.Name.replace('#', '').trim() : '';
        const shippingState = indianStates[data["Shipping Province"]] || data["Shipping Province"];

        return {
          "*Sale Order Number": saleOrderNumber,
          "*Pickup Location Name": "RISHI TREDARS",
          "*Transport Mode": "Surface",
          "*Payment Mode": "COD",
          "COD Amount": data.Total,
          "*Customer Name": data["Shipping Name"],
          "*Customer Phone": data["Shipping Phone"],
          "*Shipping Address Line1": data["Shipping Address1"],
          "Shipping Address Line2": data["Shipping Address2"],
          "*Shipping City": data["Shipping City"],
          "*Shipping State": shippingState,
          "*Shipping Pincode": data["Shipping Zip"].replace(/^'/, ""),
          "*Item Sku Code": "NGE101",
          "*Item Sku Name": data["Lineitem name"],
          "*Quantity Ordered": "1",
          "*Unit Item Price": data["Lineitem price"],
          "Package Name": "",
          "Packaging Type": "Box",
          "Length (cm)": "5",
          "Breadth (cm)": "5",
          "Height (cm)": "5",
          "Packaged Product Weight (gm)": Math.floor(Math.random() * 10) + 240,
          "Product Weight (gm)": Math.floor(Math.random() * (99 - 79 + 1)) + 79,
          "Fragile Shipment": "",
          "Discount Type": "",
          "Discount Value": "",
          "Tax Class Code": "",
          "Customer Email": "",
          "Billing Address same as Shipping Address": "",
          "Billing Address Line1": data["Shipping Address1"],
          "Billing Address Line2": data["Shipping Address2"],
          "Billing City": data["Shipping City"],
          "Billing State": shippingState,
          "*Shipping Pincode": data["Shipping Zip"].replace(/^'/, ""),
          "e-Way Bill Number": "",
          "Seller Name": "",
          "Seller GST Number": "",
          "Seller Address Line1": "",
          "Seller Address Line2": "",
          "Seller City": "",
          "Seller State": "",
          "Seller Pincode": ""
        };
      });

      const csvData = Papa.unparse(results);
      fs.writeFileSync(outputFilePath, csvData);
    }
  });
};

// Serve the static index.html file on root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes

// Upload CSV and Process
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const inputFilePath = req.file.path;
  const outputFilePath = path.join(deliveryDirectory, `output_${req.file.filename}`);

  processCSV(inputFilePath, outputFilePath);

  res.status(200).send({
    message: 'File processed successfully!',
    download_url: `/download/${path.basename(outputFilePath)}`
  });
});

// Download Processed CSV
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(deliveryDirectory, req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found.');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
