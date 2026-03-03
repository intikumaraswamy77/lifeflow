/**
 * Script to fix coordinate order in database
 * MongoDB GeoJSON requires [longitude, latitude] but coordinates might be stored as [latitude, longitude]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function fixCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Test search parameters
    const searchLat = 16.85868;
    const searchLon = 81.495017;
    const maxDistanceMeters = 100000; // 100km

    console.log('\n=== CHECKING DONOR COORDINATES ===');
    console.log(`Search Location: ${searchLat}, ${searchLon}`);
    console.log(`Max Distance: ${maxDistanceMeters / 1000} km\n`);

    // Get all donors with locations
    const donors = await User.find({
      userType: 'donor',
      isActive: true,
      location: { $exists: true, $ne: null }
    }).select('name phone bloodGroup address location');

    console.log(`Found ${donors.length} active donors with locations\n`);

    const needsFixing = [];
    const alreadyCorrect = [];

    donors.forEach(donor => {
      if (!donor.location || !donor.location.coordinates || donor.location.coordinates.length !== 2) {
        console.log(`⚠️  ${donor.name}: Invalid location data`);
        return;
      }

      const [coord1, coord2] = donor.location.coordinates;

      // Check if coordinates look like they're in the right format
      // Longitude should be -180 to 180, latitude -90 to 90
      // For India: longitude ~68-97, latitude ~8-37
      
      // If coord1 is < 50, it's likely latitude (should be longitude)
      // If coord2 is > 50, it's likely longitude (should be latitude)
      const looksSwapped = coord1 < 50 && coord2 > 50;

      // Calculate distance with current format [lng, lat]
      const distanceCurrent = calculateDistance(searchLat, searchLon, coord2, coord1);
      
      // Calculate distance if we swap to [lat, lng]
      const distanceSwapped = calculateDistance(searchLat, searchLon, coord1, coord2);

      const currentKm = (distanceCurrent / 1000).toFixed(2);
      const swappedKm = (distanceSwapped / 1000).toFixed(2);
      const withinRangeCurrent = distanceCurrent <= maxDistanceMeters;
      const withinRangeSwapped = distanceSwapped <= maxDistanceMeters;

      console.log(`${donor.name} [${donor.bloodGroup}]:`);
      console.log(`  Current format [${coord1}, ${coord2}]: ${currentKm} km ${withinRangeCurrent ? '✓' : '✗'}`);
      console.log(`  If swapped [${coord2}, ${coord1}]: ${swappedKm} km ${withinRangeSwapped ? '✓' : '✗'}`);

      if (looksSwapped || (!withinRangeCurrent && withinRangeSwapped)) {
        console.log(`  🔧 NEEDS FIXING - coordinates appear to be swapped\n`);
        needsFixing.push({
          _id: donor._id,
          name: donor.name,
          current: [coord1, coord2],
          corrected: [coord2, coord1]
        });
      } else {
        console.log(`  ✅ Looks correct\n`);
        alreadyCorrect.push(donor);
      }
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total donors: ${donors.length}`);
    console.log(`Already correct: ${alreadyCorrect.length}`);
    console.log(`Need fixing: ${needsFixing.length}\n`);

    if (needsFixing.length > 0) {
      console.log('Donors that need coordinate swap:');
      needsFixing.forEach(d => {
        console.log(`  - ${d.name}: ${d.current} → ${d.corrected}`);
      });

      console.log('\n⚠️  DO YOU WANT TO FIX THESE COORDINATES? (y/n)');
      console.log('This will swap the coordinate order for the above donors.');
      console.log('\nTo apply the fix, uncomment the UPDATE section in this script and run again.\n');

      // UNCOMMENT THIS SECTION TO APPLY THE FIX:
      /*
      console.log('\nApplying fixes...');
      for (const donor of needsFixing) {
        await User.updateOne(
          { _id: donor._id },
          { $set: { 'location.coordinates': donor.corrected } }
        );
        console.log(`✓ Fixed ${donor.name}`);
      }
      console.log('\n✅ All coordinates fixed!');
      */
      
      console.log('❌ Fix not applied (code is commented). Uncomment to apply fixes.');
    } else {
      console.log('✅ All coordinates are already in the correct format!');
    }

    // Verify geospatial index
    console.log('\n=== CHECKING GEOSPATIAL INDEX ===');
    const indexes = await User.collection.getIndexes();
    const hasGeoIndex = Object.values(indexes).some(idx => 
      idx.key && idx.key.location === '2dsphere'
    );
    
    if (hasGeoIndex) {
      console.log('✅ Geospatial index exists on location field');
    } else {
      console.log('⚠️  Geospatial index NOT found! Creating it...');
      await User.collection.createIndex({ location: '2dsphere' });
      console.log('✅ Geospatial index created');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixCoordinates();
