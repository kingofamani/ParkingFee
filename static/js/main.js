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

async function handleQuery(allCities = false) {
    const form = document.getElementById('parking-form');
    const carIdInput = document.getElementById('car-id');
    const resultsArea = document.getElementById('results-area');
    
    // Simple validation
    if (!allCities && !form.elements.city.value) {
        alert('請選擇一個縣市');
        return;
    }
    if (!carIdInput.value.trim()) {
        alert('請輸入車牌號碼');
        carIdInput.focus();
        return;
    }

    const formData = {
        carId: carIdInput.value.trim().toUpperCase(),
        carType: form.elements.carType.value
    };

    let endpoint = '/api/query';
    if (allCities) {
        endpoint = '/api/query-all';
    } else {
        formData.city = form.elements.city.value;
    }

    showLoading(true);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '查詢時發生錯誤');
        }

        const data = await response.json();
        displayResults(data);
        
        // Save successful query to Local Storage
        saveToLocalStorage({ query: formData, results: data });

    } catch (error) {
        console.error('Query Error:', error);
        displayResults({ error: error.message });
    } finally {
        showLoading(false);
    }
}

function showLoading(isLoading) {
    const resultsArea = document.getElementById('results-area');
    if (isLoading) {
        resultsArea.innerHTML = '<div class="spinner"></div>';
    } else {
        // Clear spinner if it exists, but don't clear results
        const spinner = resultsArea.querySelector('.spinner');
        if (spinner) {
            resultsArea.innerHTML = '';
        }
    }
}

function displayResults(data) {
    const resultsArea = document.getElementById('results-area');
    resultsArea.innerHTML = ''; // Clear previous results or spinner

    if (data.error) {
        resultsArea.innerHTML = `<p class="error-message">${data.error}</p>`;
        return;
    }

    // Normalize data structure for consistent processing
    let allResults = [];
    if (Array.isArray(data)) { // This should now always be true for all-cities query
        data.forEach(cityResult => {
            if (cityResult.status === "success" && cityResult.data) {
                const cityData = cityResult.data;
                const city = cityResult.city;
                
                // 1. Taipei Format
                if (cityData.Result && cityData.Result.Bills) {
                    const plateNo = cityData.Result.CarID;
                    cityData.Result.Bills.forEach(item => {
                        allResults.push({ PlateNo: plateNo, PayDeadline: item.PayLimitDate, EntryTime: item.ParkingDate, Amount: item.Amount, Location: item.ParkingLocation || '無資料', city: city });
                    });
                } 
                // 2. Kaohsiung Format
                else if (Array.isArray(cityData.Data)) {
                    cityData.Data.forEach(item => {
                        allResults.push({ PlateNo: item.carNo, PayDeadline: item.deadline, EntryTime: item.inTime, Amount: item.amount, Location: item.location, city: city });
                    });
                }
                // 3. Standard Format
                else if (cityData.PayBillList) {
                    cityData.PayBillList.forEach(item => {
                        allResults.push({ ...item, city: city });
                    });
                }
            }
        });
    } else { // This block handles single-city query for backward compatibility and direct API structure
        const city = document.getElementById('city-select').value;
        // 1. Taipei Format
        if (data.Result && data.Result.Bills) {
            const plateNo = data.Result.CarID;
            data.Result.Bills.forEach(item => {
                 allResults.push({ PlateNo: plateNo, PayDeadline: item.PayLimitDate, EntryTime: item.ParkingDate, Amount: item.Amount, Location: item.ParkingLocation || '無資料', city: city });
            });
        }
        // 2. Kaohsiung Format
        else if (Array.isArray(data.Data)) {
            data.Data.forEach(item => {
                allResults.push({ PlateNo: item.carNo, PayDeadline: item.deadline, EntryTime: item.inTime, Amount: item.amount, Location: item.location, city: city });
            });
        }
        // 3. Standard Format
        else if (data.PayBillList) {
            data.PayBillList.forEach(item => {
                allResults.push({ ...item, city: city });
            });
        }
    }

    if (allResults.length === 0) {
        resultsArea.innerHTML = `<p class="info-message">查無任何縣市的待繳停車費資料。</p>`;
        return;
    }

    const title = document.createElement('h2');
    title.className = 'results-title';
    title.textContent = '查詢結果';
    resultsArea.appendChild(title);

    allResults.forEach(item => {
        const card = createResultCard(item);
        resultsArea.appendChild(card);
    });
}

function createResultCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Format date and time strings for better readability
    const entryTime = item.EntryTime ? new Date(item.EntryTime).toLocaleString('zh-TW') : '無資料';
    const deadline = item.PayDeadline ? new Date(item.PayDeadline).toLocaleDateString('zh-TW') : '無資料';

    card.innerHTML = `
        <div class="card-header">
            <span class="plate-no">${item.PlateNo}</span>
            <span class="city-badge">${item.city}</span>
        </div>
        <div class="card-body">
            <p><strong>停車地點:</strong> ${item.Location || '無資料'}</p>
            <p><strong>入場時間:</strong> ${entryTime}</p>
            <p><strong>繳費期限:</strong> ${deadline}</p>
        </div>
        <div class="card-footer">
            <span class="amount">金額: NT$ ${item.Amount}</span>
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