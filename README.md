# POIS-Project


#### 17 (CCA Secure PKC)

#### 18 (Oblivious Transfer - OT)


#### 19 (SECURE AND GATE)



#### 20 (All 2 Party Secure Computation - YAO/GMW)


### **Note:**

Current repo contains a backend server which works for PA13 to PA16 only and a frontend folder which contains components for PA13 to PA16 only!

### **How to add your implementatations to PA0?**

First you need define a path for your functionality in the backend and call respective functions that you implemented! In frontend, create a `.jsx` file and implement a page containing an interface. make sure that the frontend calls right backend path that you created!

## Running the Project

### Backend
```bash
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```
- Then go to browser and check `localhost:3000`