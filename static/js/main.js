document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    // Attempt to set city based on user's location
    setCityByGeolocation();

    // Bind event listeners
    const form = document.getElementById('parking-form');
    const queryAllBtn = document.getElementById('query-all-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleQuery();
    });

    queryAllBtn.addEventListener('click', () => {
        handleQuery(true);
    });

    // Load last query from storage
    loadFromLocalStorage();
}

function setCityByGeolocation() {
    if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({})); // Handle non-json error response
                    const errorMessage = errorData.error || `Failed to fetch city with status: ${response.status}`;
                    throw new Error(errorMessage);
                }
                
                const data = await response.json();
                if (data.city) {
                    const citySelect = document.getElementById('city-select');
                    // The returned city name might contain "市" or "縣", remove it for better matching
                    const cityName = data.city.replace(/[市縣]$/, '');
                    for (let option of citySelect.options) {
                         // Match against option text that also has "市" or "縣" removed
                        if (option.text.replace(/[市縣]$/, '') === cityName) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error("Error getting city from location:", error);
            }
        },
        (error) => {
            console.error("Error getting location:", error.message);
        }
    );
}

// --- NEW BATCH PROCESSING HELPER FUNCTION ---
async function runPromisesInBatches(promiseFactories, batchSize) {
    let results = [];
    let index = 0;
    while (index < promiseFactories.length) {
        const batch = promiseFactories.slice(index, index + batchSize);
        const batchResults = await Promise.all(batch.map(factory => factory()));
        results = results.concat(batchResults);
        index += batchSize;
    }
    return results;
}

async function handleQuery(allCities = false) {
    const form = document.getElementById('parking-form');
    const carIdInput = document.getElementById('car-id');
    const resultsArea = document.getElementById('results-area');
    const citySelect = document.getElementById('city-select');

    if (!carIdInput.value.trim()) {
        alert('請輸入車牌號碼');
        carIdInput.focus();
        return;
    }

    const carId = carIdInput.value.trim().toUpperCase();
    const carType = form.elements.carType.value;

    showLoading(true, allCities);

    if (allCities) {
        // --- UPDATED LOGIC FOR ALL CITIES WITH BATCHING ---
        const cities = Array.from(citySelect.options)
            .map(option => ({ name: option.text, value: option.value }))
            .filter(city => city.value);

        // --- Progressive UI Update ---
        // Clear previous results and show a list of cities being queried
        resultsArea.innerHTML = '';
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        resultsArea.appendChild(progressContainer);

        cities.forEach(city => {
            const progressItem = document.createElement('div');
            progressItem.className = 'progress-item';
            progressItem.id = `progress-${city.value}`;
            progressItem.innerHTML = `<span>${city.name}</span><div class="spinner tiny"></div>`;
            progressContainer.appendChild(progressItem);
        });
        // --- End Progressive UI Update ---

        const promiseFactories = cities.map(city => () => // Create functions that return promises
            fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carId, carType, city: city.value })
            })
            .then(async response => {
                if (!response.ok) {
                    return { status: 'error', city: city.name, value: city.value, message: `伺服器錯誤: ${response.status}` };
                }
                const data = await response.json().catch(() => null);
                 if (!data) {
                    return { status: 'error', city: city.name, value: city.value, message: 'API未回傳有效的JSON資料' };
                }
                const hasData = (data.Result && data.Result.Bills && data.Result.Bills.length > 0) ||
                                (data.PayBillList && data.PayBillList.length > 0) ||
                                (data.Data && data.Data.length > 0);
                
                if (hasData) {
                    return { status: 'success', city: city.name, value: city.value, data: data };
                } else {
                    return { status: 'success_nodata', city: city.name, value: city.value, data: null };
                }
            })
            .catch(error => {
                return { status: 'error', city: city.name, value: city.value, message: `查詢失敗: ${error.message}` };
            })
            .then(result => {
                // --- Update individual progress item ---
                const progressItem = document.getElementById(`progress-${result.value}`);
                if (progressItem) {
                    let statusIcon = '';
                    if (result.status === 'success') statusIcon = '<span class="status-icon success">✔</span>';
                    else if (result.status === 'success_nodata') statusIcon = '<span class="status-icon nodata">◌</span>';
                    else if (result.status === 'error') statusIcon = '<span class="status-icon error">✖</span>';
                    progressItem.innerHTML = `<span>${result.city}</span>${statusIcon}`;
                }
                return result; // Pass the result on
            })
        );
        
        try {
            // Set batch size to 5
            const results = await runPromisesInBatches(promiseFactories, 5);
            displayResults(results, true); // Pass a flag to indicate all-cities results
            saveToLocalStorage({ query: { carId, carType, allCities: true }, results });
        } catch (error) {
            console.error('All Cities Query Error:', error);
            displayResults({ error: '查詢全國時發生未預期錯誤。' });
        }

    } else {
        // --- EXISTING LOGIC FOR SINGLE CITY ---
        const city = citySelect.value;
        if (!city) {
            alert('請選擇一個縣市');
            showLoading(false); // Hide loading since we are not proceeding
            return;
        }

        const formData = { carId, carType, city };
        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`伺服器錯誤，狀態碼: ${response.status}`);
            }

            const data = await response.json();
            displayResults(data);
            saveToLocalStorage({ query: formData, results: data });

        } catch (error) {
            console.error('Query Error:', error);
            displayResults({ error: error.message });
        }
    }
}

function showLoading(isLoading, allCities = false) {
    const resultsArea = document.getElementById('results-area');
    if (isLoading) {
        // For single city query, we can keep the old spinner logic
        if (!allCities) {
            resultsArea.innerHTML = '<div class="spinner"></div>';
        }
    } else {
        // Clear spinner if it exists, but don't clear results
        const spinner = resultsArea.querySelector('.spinner');
        if (spinner) {
            resultsArea.innerHTML = '';
        }
    }
}

function displayResults(data, isAllCitiesResult = false) {
    const resultsArea = document.getElementById('results-area');
    
    // For all-cities, we don't clear the progressive results, we append to them.
    if (!isAllCitiesResult) {
        resultsArea.innerHTML = ''; // Clear previous results or spinner
    }

    if (data.error) {
        resultsArea.innerHTML = `<p class="error-message">${data.error}</p>`;
        return;
    }
    
    const allBills = [];
    const noDataCities = [];
    const errorCities = [];

    // This is now the standard for all-cities query
    if (Array.isArray(data)) { 
        // Hide the progress container before showing final results
        const progressContainer = resultsArea.querySelector('.progress-container');
        if (progressContainer) progressContainer.style.display = 'none';

        data.forEach(cityResult => {
            if (cityResult.status === "success" && cityResult.data) {
                const cityData = cityResult.data;
                const city = cityResult.city;
                let foundBills = false;
                 // 1. Taipei Format
                 if (cityData.Result && cityData.Result.Bills && cityData.Result.Bills.length > 0) {
                    const plateNo = cityData.Result.CarID;
                    cityData.Result.Bills.forEach(item => {
                        allBills.push({
                            BillNo: item.BillNo,
                            PlateNo: plateNo,
                            EntryTime: item.ParkingDate,
                            PayDeadline: item.PayLimitDate,
                            Amount: item.Amount,
                            ParkingHours: item.ParkingHours,
                            Location: item.ParkingLocation || '無資料',
                            city: city
                        });
                    });
                    foundBills = true;
                } 
                // 2. Kaohsiung Format
                else if (Array.isArray(cityData.Data) && cityData.Data.length > 0) {
                    cityData.Data.forEach(item => {
                        allBills.push({ 
                            BillNo: item.billNo || item.BillNo || '無資料',
                            PlateNo: item.carNo, 
                            PayDeadline: item.deadline, 
                            EntryTime: item.inTime, 
                            Amount: item.amount, 
                            ParkingHours: item.parkingHours || '無資料',
                            Location: item.location, 
                            city: city 
                        });
                    });
                    foundBills = true;
                }
                // 3. Standard Format
                else if (cityData.PayBillList && cityData.PayBillList.length > 0) {
                    cityData.PayBillList.forEach(item => {
                        allBills.push({ ...item, city: city });
                    });
                    foundBills = true;
                }
                
                if (!foundBills) noDataCities.push(city);

            } else if (cityResult.status === "success_nodata") {
                noDataCities.push(cityResult.city);
            } else if (cityResult.status === "error") {
                errorCities.push({ city: cityResult.city, message: cityResult.message });
            }
        });
    } else { // Fallback for single-city query
         const city = document.getElementById('city-select').value;
         // 1. Taipei Format
         if (data.Result && data.Result.Bills && data.Result.Bills.length > 0) {
            const plateNo = data.Result.CarID;
            data.Result.Bills.forEach(item => allBills.push({ 
                BillNo: item.BillNo,
                PlateNo: plateNo, 
                EntryTime: item.ParkingDate,
                PayDeadline: item.PayLimitDate,
                ParkingHours: item.ParkingHours,
                Amount: item.Amount,
                Location: item.ParkingLocation || '無資料',
                city:city 
            }));
         } else if (data.PayBillList && data.PayBillList.length > 0) {
            data.PayBillList.forEach(item => allBills.push({ ...item, city:city }));
         } else if (data.Data && data.Data.length > 0) {
             data.Data.forEach(item => allBills.push({
                BillNo: item.billNo || item.BillNo || '無資料',
                PlateNo: item.carNo, 
                PayDeadline: item.deadline, 
                EntryTime: item.inTime, 
                Amount: item.amount, 
                ParkingHours: item.parkingHours || '無資料',
                Location: item.location, 
                city: city
             }));
         }
    }

    if (allBills.length === 0 && noDataCities.length === 0 && errorCities.length === 0) {
        // Check if it was an all-cities query, if so, the progressive UI already showed no results.
        if (!isAllCitiesResult) {
             resultsArea.innerHTML = `<p class="info-message">查無任何縣市的待繳停車費資料。</p>`;
        }
        return;
    }
    
    // Display bills
    if (allBills.length > 0) {
        const title = document.createElement('h2');
        title.className = 'results-title';
        title.textContent = '待繳費用';
        resultsArea.appendChild(title);
        allBills.forEach(item => {
            const card = createResultCard(item);
            resultsArea.appendChild(card);
        });
    }

    // Display cities with no data
    if (noDataCities.length > 0) {
        const title = document.createElement('h2');
        title.className = 'results-title';
        title.textContent = '無待繳費用的縣市';
        resultsArea.appendChild(title);
        const noDataContainer = document.createElement('div');
        noDataContainer.className = 'no-data-container';
        noDataCities.forEach(city => {
            const chip = document.createElement('span');
            chip.className = 'city-chip';
            chip.textContent = city;
            noDataContainer.appendChild(chip);
        });
        resultsArea.appendChild(noDataContainer);
    }
    
    // Display cities with errors
    if (errorCities.length > 0) {
        const title = document.createElement('h2');
        title.className = 'results-title error-title';
        title.textContent = '查詢失敗的縣市';
        resultsArea.appendChild(title);
         errorCities.forEach(item => {
            const errorCard = createErrorCard(item);
            resultsArea.appendChild(errorCard);
        });
    }
}

function createResultCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Format date and time strings for better readability
    const entryTime = item.EntryTime ? new Date(item.EntryTime).toLocaleString('zh-TW') : '無資料';
    const deadline = item.PayDeadline ? new Date(item.PayDeadline).toLocaleDateString('zh-TW') : '無資料';
    const parkingHours = item.ParkingHours ? `${item.ParkingHours} 小時` : '無資料';

    card.innerHTML = `
        <div class="card-header">
            <span class="plate-no">${item.PlateNo}</span>
            <span class="city-badge">${item.city}</span>
        </div>
        <div class="card-body">
            <p><strong>停車單號:</strong> ${item.BillNo || '無資料'}</p>
            <p><strong>停車地點:</strong> ${item.Location || '無資料'}</p>
            <p><strong>入場時間:</strong> ${entryTime}</p>
            <p><strong>繳費期限:</strong> ${deadline}</p>
            <p><strong>停車時數:</strong> ${parkingHours}</p>
        </div>
        <div class="card-footer">
            <span class="amount">金額: NT$ ${item.Amount || 'N/A'}</span>
        </div>
    `;
    return card;
}

function createErrorCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card error-card';
    card.innerHTML = `
        <div class="card-header">
            <span class="plate-no">${item.city}</span>
            <span class="city-badge error-badge">查詢失敗</span>
        </div>
        <div class="card-body">
            <p><strong>原因:</strong> ${item.message}</p>
        </div>
    `;
    return card;
}

function saveToLocalStorage(data) {
    try {
        // We can store an array of queries in the future. For now, just the last one.
        localStorage.setItem('lastParkingQuery', JSON.stringify(data));
        console.log("Query saved to Local Storage.");
    } catch (e) {
        console.error("Failed to save to Local Storage", e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('lastParkingQuery');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log("Loaded data from Local Storage:", parsedData);

            // Populate form fields
            if (parsedData.query) {
                document.getElementById('car-id').value = parsedData.query.carId || '';
                const carTypeRadio = document.querySelector(`input[name="carType"][value="${parsedData.query.carType}"]`);
                if (carTypeRadio) {
                    carTypeRadio.checked = true;
                }
            }

            // Display last results
            if (parsedData.results) {
                displayResults(parsedData.results);
            }
        }
    } catch (e) {
        console.error("Failed to load from Local Storage", e);
    }
} 