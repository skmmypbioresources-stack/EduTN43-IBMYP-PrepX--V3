import { ClassSection, Student, Wing, Teacher } from './types';

// Complete Official Teachers Directory
export const TEACHERS_LIST: Teacher[] = [
  { id: 't-sgm', name: 'Sai Sangamitra', code: 'SGM' },
  { id: 't-rj', name: 'Rajasekar S', code: 'RJ' },
  { id: 't-okt', name: 'Omana K Thomas', code: 'OKT' },
  { id: 't-srl', name: 'Sreelalitha', code: 'SRL' },
  { id: 't-lyt', name: 'Lidya Teena', code: 'LYT' },
  { id: 't-skm', name: 'Senthil Kumar R', code: 'SKM' },
  { id: 't-mdn', name: 'Madhusoodhanan', code: 'MDN' },
  { id: 't-eta', name: 'Ajith E T', code: 'ETA' },
  { id: 't-syb', name: 'Suyash Bajpai', code: 'SYB' },
  { id: 't-vdr', name: 'Varsha Deshiker M R', code: 'VDR' },
  { id: 't-kr', name: 'K Ramani', code: 'KR' },
  { id: 't-ajs', name: 'Anand Jeyasingh S', code: 'AJS' },
  { id: 't-nvp', name: 'Neelima V P', code: 'NVP' },
  { id: 't-sma', name: 'Shaikh Mohammed Afsar M', code: 'SMA' },
  { id: 't-cds', name: 'Chandana Sen', code: 'CDS' },
  { id: 't-ksk', name: 'Kiran Shukla', code: 'KSK' },
  { id: 't-msk', name: 'Sateesh', code: 'MSK' },
  { id: 't-avs', name: 'Shanthini', code: 'AVS' },
  { id: 't-alb', name: 'Anthony Lazar Babu', code: 'ALB' },
  { id: 't-sdt', name: 'Sandeep Tonge', code: 'SDT' },
  { id: 't-rth', name: 'Ritu Singh Deval', code: 'RTH' },
  { id: 't-ssq', name: 'Sinan Sidheeq', code: 'SSQ' },
  { id: 't-pr', name: 'Piyush Ranjan', code: 'PR' },
  { id: 't-njk', name: 'Nanda Jeevesh Kukreja', code: 'NJK' },
  { id: 't-mc', name: 'Maitri Chatterjee', code: 'MC' },
  { id: 't-sdp', name: 'Subhadip Pradhan', code: 'SDP' },
  { id: 't-vc', name: 'Vishnu Chandran', code: 'VC' },
  { id: 't-amc', name: 'Ashish Mathew Cherian', code: 'AMC' },
  { id: 't-spc', name: 'S Prabhakara Choudhary', code: 'SPC' },
  { id: 't-kyv', name: 'Komal Yadav', code: 'KYV' },
  { id: 't-chi', name: 'Chiteshwary Rajput', code: 'CHI' },
  { id: 't-ajm', name: 'Ajith.M', code: 'AJM' },
  { id: 't-eak', name: 'Elizabeth Kumari', code: 'EAK' },
  { id: 't-ndk', name: 'Nandha Kumar', code: 'NDK' },
  { id: 't-sy', name: 'Sagar Yadav', code: 'SY' },
  { id: 't-fbd', name: 'Felix Basil Dmello', code: 'FBD' },
  { id: 't-vb', name: 'Vibhav Borwankar', code: 'VB' },
  { id: 't-kck', name: 'KCK', code: 'KCK' },
  { id: 't-dss', name: 'DSS', code: 'DSS' },
  { id: 't-aky', name: 'AKY', code: 'AKY' }
];

// Teachers List (Codes / Initials)
export const MOCK_TEACHERS = TEACHERS_LIST.map(t => t.code);

// --- MYP OFFICIAL STUDENT ROSTERS ---
export const MYP1A_RAW: Student[] = [
  { id: 'myp1a-1', rollNumber: 8674, name: 'CHARAN SAI M' },
  { id: 'myp1a-2', rollNumber: 8593, name: 'RAJHVEER MAYYUR DASPUTE' },
  { id: 'myp1a-3', rollNumber: 8560, name: 'JOEL MARVIN REDDY THUMMA' },
  { id: 'myp1a-4', rollNumber: 8457, name: 'RONAQ MALIK G' },
  { id: 'myp1a-5', rollNumber: 8497, name: 'SHASHANK KARTHICKEN' },
  { id: 'myp1a-6', rollNumber: 8463, name: 'RUSHIL NAIK NENAVATH' },
  { id: 'myp1a-7', rollNumber: 8416, name: 'JAYDEN GOUNDER' },
  { id: 'myp1a-8', rollNumber: 8415, name: 'HITARTH JAYSON HIRANI' },
  { id: 'myp1a-9', rollNumber: 8225, name: 'HARDVI HITESH BHARVAD' },
  { id: 'myp1a-10', rollNumber: 8166, name: 'ADHEEKSHAN NIMALAN' },
  { id: 'myp1a-11', rollNumber: 8416, name: 'JAYDEN GOUNDER' },
  { id: 'myp1a-12', rollNumber: 8329, name: 'SRI VISHNU PRADHAN A.P' },
  { id: 'myp1a-13', rollNumber: 8302, name: 'NIRANJAN' },
  { id: 'myp1a-14', rollNumber: 8448, name: 'ANJANA HARIKRISHNAN' },
  { id: 'myp1a-15', rollNumber: 8448, name: 'PRISHA AGRAWAL' },
  { id: 'myp1a-16', rollNumber: 8610, name: 'PARV SURANA' },
  { id: 'myp1a-17', rollNumber: 8544, name: 'SAI THATHVA ROHIN CHUNDI' },
  { id: 'myp1a-18', rollNumber: 8425, name: 'AKSHAN C V' },
  { id: 'myp1a-19', rollNumber: 8348, name: 'AHAN KEDIA' }
];

export const MYP1B_RAW: Student[] = [
  { id: 'myp1b-1', rollNumber: 8381, name: 'MAHI AMOL DUSANE' },
  { id: 'myp1b-2', rollNumber: 8418, name: 'TAKSHVEE MANOJKUMAR' },
  { id: 'myp1b-3', rollNumber: 8376, name: 'GUDIPALLY SHIVA SAI' },
  { id: 'myp1b-4', rollNumber: 8633, name: 'PRANAV SHERAWAT' },
  { id: 'myp1b-5', rollNumber: 8364, name: 'AHAAN SAGAR KHURANA' },
  { id: 'myp1b-6', rollNumber: 8361, name: 'HEER NIKHIL KOTHARI' },
  { id: 'myp1b-7', rollNumber: 8349, name: 'ABIR KEDIA' },
  { id: 'myp1b-8', rollNumber: 8298, name: 'AVYUKTH CHOWDARY CHERUKURI' },
  { id: 'myp1b-9', rollNumber: 8671, name: 'ARAV MENNENI' },
  { id: 'myp1b-10', rollNumber: 8212, name: 'SHYAM RANGPARIYA' },
  { id: 'myp1b-11', rollNumber: 8558, name: 'DHRUV SARAWGI' },
  { id: 'myp1b-12', rollNumber: 8502, name: 'HRIDHAN CHANDRAKANT PATIL' },
  { id: 'myp1b-13', rollNumber: 8296, name: 'KIAAN SAMEER PATEL' },
  { id: 'myp1b-14', rollNumber: 8267, name: 'KUMMITHI SHANMUKA SAI REDDY' },
  { id: 'myp1b-15', rollNumber: 8373, name: 'HERIT RAVIRAJ NESADIYA' },
  { id: 'myp1b-16', rollNumber: 8356, name: 'A.P.RIHAAN' },
  { id: 'myp1b-17', rollNumber: 8301, name: 'KAVIN KRISH RR' },
  { id: 'myp1b-18', rollNumber: 8549, name: 'DHRITI SURANA' }
];

export const MYP2A_RAW: Student[] = [
  { id: 'myp2a-1', rollNumber: 8642, name: 'JAANVI AGARWAL' },
  { id: 'myp2a-2', rollNumber: 8617, name: 'AJOONI KAUR' },
  { id: 'myp2a-3', rollNumber: 8604, name: 'SK ANMOL' },
  { id: 'myp2a-4', rollNumber: 8588, name: 'SHRESTH RUIA' },
  { id: 'myp2a-5', rollNumber: 8564, name: 'SARVAM PULINBHAI JASOLIYA' },
  { id: 'myp2a-6', rollNumber: 8521, name: 'RUTANSHI DEVDA' },
  { id: 'myp2a-7', rollNumber: 8379, name: 'ARTH ABHI SETTY' },
  { id: 'myp2a-8', rollNumber: 8442, name: 'VEERA RAVI SUTARIYA' },
  { id: 'myp2a-9', rollNumber: 8133, name: 'MIRUDULLA SAI MAHESH' },
  { id: 'myp2a-10', rollNumber: 8088, name: 'VIVAAN KAUL' },
  { id: 'myp2a-11', rollNumber: 7756, name: 'HET HITESHBHAI BHARVAD' },
  { id: 'myp2a-12', rollNumber: 7731, name: 'ITHAL INEYA L S' },
  { id: 'myp2a-13', rollNumber: 8658, name: 'SIMHASKANDA KUNUKUNTLA' }
];

export const MYP2B_RAW: Student[] = [
  { id: 'myp2b-1', rollNumber: 8667, name: 'AMAIRA SAWA' },
  { id: 'myp2b-2', rollNumber: 8661, name: 'BELLA ASH MOTIMAYA' },
  { id: 'myp2b-3', rollNumber: 8540, name: 'SUHANI RITESH PATEL' },
  { id: 'myp2b-4', rollNumber: 8510, name: 'ANSH ROONGTA' },
  { id: 'myp2b-5', rollNumber: 8534, name: 'ARTH GOYAL' },
  { id: 'myp2b-6', rollNumber: 8531, name: 'SAMAIRA JAIN' },
  { id: 'myp2b-7', rollNumber: 8513, name: 'AYAAN GUPTA' },
  { id: 'myp2b-8', rollNumber: 8488, name: 'JENISH SIDDHARTH PATEL' },
  { id: 'myp2b-9', rollNumber: 8479, name: 'SOLANKI MIHIR MINESHBHAI' },
  { id: 'myp2b-10', rollNumber: 8456, name: 'G NITHISH CHOWDARY' },
  { id: 'myp2b-11', rollNumber: 8181, name: 'V KRISHIYEAH' },
  { id: 'myp2b-12', rollNumber: 8056, name: 'KAKARLA RANGA PRABHANJAN' },
  { id: 'myp2b-13', rollNumber: 8015, name: 'SHIVAN RAJ DHOLAKIA' },
  { id: 'myp2b-14', rollNumber: 7972, name: 'ANAISHA CHORDIA' },
  { id: 'myp2b-15', rollNumber: 7755, name: 'ADITH ARADHYA' }
];

export const MYP2C_RAW: Student[] = [
  { id: 'myp2c-1', rollNumber: 1, name: 'MIRAYA SHARVIL SHRIDHAR' },
  { id: 'myp2c-2', rollNumber: 2, name: 'JAANVI AGARWAL' },
  { id: 'myp2c-3', rollNumber: 3, name: 'VIHAAN YELAMARTI' },
  { id: 'myp2c-4', rollNumber: 4, name: 'MANTRA HIMANSHUBHAI DOBARIYA' },
  { id: 'myp2c-5', rollNumber: 5, name: 'ARKO BANERJEE' },
  { id: 'myp2c-6', rollNumber: 6, name: 'AARYA SUDHIR BHOSLE' },
  { id: 'myp2c-7', rollNumber: 8471, name: 'SAMANYU GALI' },
  { id: 'myp2c-8', rollNumber: 8451, name: 'DHRUSHIL VIRAL SHAH' },
  { id: 'myp2c-9', rollNumber: 8411, name: 'VIHAN ASHISHBHAI MARVANIYA' },
  { id: 'myp2c-10', rollNumber: 8325, name: 'MOHAMMAD REHAN SHAREEF' },
  { id: 'myp2c-11', rollNumber: 8304, name: 'GUTHI PRAGNYA' },
  { id: 'myp2c-12', rollNumber: 8087, name: 'VARADA KAUL' },
  { id: 'myp2c-13', rollNumber: 7955, name: 'THANEEKSHA GOWDA R' },
  { id: 'myp2c-14', rollNumber: 7831, name: 'INAAYA DINA RAWTHAR' },
  { id: 'myp2c-15', rollNumber: 15, name: 'VIRAT ANANT JAIN' }
];

export const MYP3A_RAW: Student[] = [
  { id: 'myp3a-1', rollNumber: 8524, name: 'VED MARELLA' },
  { id: 'myp3a-2', rollNumber: 8452, name: 'AARUSH BODHAASU' },
  { id: 'myp3a-3', rollNumber: 8449, name: 'YUVRAJ . SAHU' },
  { id: 'myp3a-4', rollNumber: 8213, name: 'HENIL HIRENBHAI AMRUTIYA' },
  { id: 'myp3a-5', rollNumber: 8211, name: 'ARYAN AGARWAL' },
  { id: 'myp3a-6', rollNumber: 8149, name: 'PRISHA RAHUL MANGUKIYA' },
  { id: 'myp3a-7', rollNumber: 8072, name: 'KUNDULA KRISHNA SASIDHAR' },
  { id: 'myp3a-8', rollNumber: 8003, name: 'PRADHAKSHANAA RAJESHKUMAR' },
  { id: 'myp3a-9', rollNumber: 7698, name: 'AVNI SAMRA' },
  { id: 'myp3a-10', rollNumber: 7641, name: 'JOHAN MATHEW SHAREEN' },
  { id: 'myp3a-11', rollNumber: 8659, name: 'JESHITH KAKARLA' },
  { id: 'myp3a-12', rollNumber: 8626, name: 'SARANSH AGGARWAL' },
  { id: 'myp3a-13', rollNumber: 8606, name: 'VED SATISHBHAI MOVALIYA' },
  { id: 'myp3a-14', rollNumber: 8602, name: 'SUFIYAN SABIR FAKIR' },
  { id: 'myp3a-15', rollNumber: 8401, name: 'HARDIK MAHESHWARI' },
  { id: 'myp3a-16', rollNumber: 8597, name: 'ADVAIT JINDAL' },
  { id: 'myp3a-17', rollNumber: 8385, name: 'MANYA SIDDHARTH PATEL' }
];

export const MYP3B_RAW: Student[] = [
  { id: 'myp3b-1', rollNumber: 8410, name: 'AVYAAN KEDIA' },
  { id: 'myp3b-2', rollNumber: 8601, name: 'DARSH AGARWAL' },
  { id: 'myp3b-3', rollNumber: 8371, name: 'YOHAN CHINTAN RIBADIA' },
  { id: 'myp3b-4', rollNumber: 8336, name: 'SANAVI BARMAN' },
  { id: 'myp3b-5', rollNumber: 8299, name: 'RIKITH PACHIPULA' },
  { id: 'myp3b-6', rollNumber: 8113, name: 'SHIV RAMCHANDRA SADIGALE' },
  { id: 'myp3b-7', rollNumber: 8101, name: 'S LACSHIT NAARAYANAN' },
  { id: 'myp3b-8', rollNumber: 8090, name: 'DIVYAM AGARWAL' },
  { id: 'myp3b-9', rollNumber: 8032, name: 'AYRA ASHISH LAKHANI' },
  { id: 'myp3b-10', rollNumber: 8010, name: 'PRANEETH GUTHI' },
  { id: 'myp3b-11', rollNumber: 7960, name: 'S. NEERAJA NAYANI' },
  { id: 'myp3b-12', rollNumber: 7952, name: 'YASHI JALAN' },
  { id: 'myp3b-13', rollNumber: 8596, name: 'ARMAN RAJESH PATEL' },
  { id: 'myp3b-14', rollNumber: 8630, name: 'JIYAA GURUPRASAD BILUGALI' },
  { id: 'myp3b-15', rollNumber: 8576, name: 'JAHAN PATEL' },
  { id: 'myp3b-16', rollNumber: 8575, name: 'DEV ADITYA GANTA' },
  { id: 'myp3b-17', rollNumber: 8571, name: 'YOHAN NIKUNJ PATEL' },
  { id: 'myp3b-18', rollNumber: 8568, name: 'YASH ROONGTA' },
  { id: 'myp3b-19', rollNumber: 8517, name: 'AARADHYA RAJ SHEKHAR' }
];

export const MYP4A_RAW: Student[] = [
  { id: 'myp4a-1', rollNumber: 8046, name: 'NEEL BHAVESHBHAI KATHROTIYA' },
  { id: 'myp4a-2', rollNumber: 7939, name: 'RYANN FRANCY' },
  { id: 'myp4a-3', rollNumber: 8216, name: 'AARYAN DENISH KANASAGARA' },
  { id: 'myp4a-4', rollNumber: 7560, name: 'TEJESWAR' },
  { id: 'myp4a-5', rollNumber: 7749, name: 'ARNAV V' },
  { id: 'myp4a-6', rollNumber: 8426, name: 'MITHILESH GOKUL DUSANE' },
  { id: 'myp4a-7', rollNumber: 8402, name: 'JOHAN DALSANIYA' },
  { id: 'myp4a-8', rollNumber: 8477, name: 'GAURANGI BHANOT' },
  { id: 'myp4a-9', rollNumber: 8494, name: 'REYANSH JIWANI' },
  { id: 'myp4a-10', rollNumber: 8191, name: 'JILAY HITESH SARDHARA' },
  { id: 'myp4a-11', rollNumber: 7337, name: 'YAJ SUNIT PATEL' },
  { id: 'myp4a-12', rollNumber: 8395, name: 'KRISHIV AMISH MEHTA' },
  { id: 'myp4a-13', rollNumber: 8392, name: 'DHRUV PRANAV GANDHI' },
  { id: 'myp4a-14', rollNumber: 8472, name: 'SIYA KIRAN GALI' },
  { id: 'myp4a-15', rollNumber: 8496, name: 'JAS DARYANI' },
  { id: 'myp4a-16', rollNumber: 8639, name: 'SAMAR AJAY MEGHANI' },
  { id: 'myp4a-17', rollNumber: 8616, name: 'VIDHI SIDDHARTH SHAH' },
  { id: 'myp4a-18', rollNumber: 8064, name: 'YASHASWINI' }
];

export const MYP4B_RAW: Student[] = [
  { id: 'myp4b-1', rollNumber: 7956, name: 'SAANVI RAKESH' },
  { id: 'myp4b-2', rollNumber: 8136, name: 'GRIHITHA SRINIVAS GOWDA' },
  { id: 'myp4b-3', rollNumber: 8367, name: 'AVEKA AGARWAL' },
  { id: 'myp4b-4', rollNumber: 8440, name: 'MIRAYA' },
  { id: 'myp4b-5', rollNumber: 8460, name: 'PAVANA KSHEMAMKARI MATTUPALLI' },
  { id: 'myp4b-6', rollNumber: 8331, name: 'MILIT NEERAJ SRIVASTAVA' },
  { id: 'myp4b-7', rollNumber: 8193, name: 'PRATHAM AMISH CHANDARANA' },
  { id: 'myp4b-8', rollNumber: 8178, name: 'NIRVAAN JAIN' },
  { id: 'myp4b-9', rollNumber: 8277, name: 'VIAANN BRIJESH PATEL' },
  { id: 'myp4b-10', rollNumber: 8199, name: 'JAIVARDHAN AGARWALLA' },
  { id: 'myp4b-11', rollNumber: 8237, name: 'SAMAR AGRAWAL' },
  { id: 'myp4b-12', rollNumber: 8431, name: 'AMAANULLAH KHAN' },
  { id: 'myp4b-13', rollNumber: 8478, name: 'NISHIKA JUNEJA' },
  { id: 'myp4b-14', rollNumber: 7949, name: 'ADITI SANTRA' },
  { id: 'myp4b-15', rollNumber: 7769, name: 'ESHITHA SEELAM' },
  { id: 'myp4b-16', rollNumber: 8270, name: 'AADHEESH PATEL' },
  { id: 'myp4b-17', rollNumber: 8612, name: 'ANIT PATRO PATNALA' },
  { id: 'myp4b-18', rollNumber: 8611, name: 'AARJYOHI LAHIRI' },
  { id: 'myp4b-19', rollNumber: 8539, name: 'VIVAAN AGRAWAL' },
  { id: 'myp4b-20', rollNumber: 8528, name: 'ARTH NIKUNJ PATEL' }
];

export const MYP4C_RAW: Student[] = [
  { id: 'myp4c-1', rollNumber: 8326, name: 'ALEX PARESH BAVALIYA' },
  { id: 'myp4c-2', rollNumber: 7966, name: 'VIRAT SAI M' },
  { id: 'myp4c-3', rollNumber: 8282, name: 'SHAAN SAKHIYA' },
  { id: 'myp4c-4', rollNumber: 8500, name: 'KRISHNA REDDY TEEGALA' },
  { id: 'myp4c-5', rollNumber: 8407, name: 'KAYRA SARVESH SALVI CHAVAN' },
  { id: 'myp4c-6', rollNumber: 8378, name: 'SUKRITI SARASWAT' },
  { id: 'myp4c-7', rollNumber: 8165, name: 'AARAV SIPANI' },
  { id: 'myp4c-8', rollNumber: 8084, name: 'NEEV NIRAV PATEL' },
  { id: 'myp4c-9', rollNumber: 7889, name: 'YAKKSHH MIRANI' },
  { id: 'myp4c-10', rollNumber: 7767, name: 'VIVAAN SANGILIRAJ' },
  { id: 'myp4c-11', rollNumber: 8079, name: 'SAI SMARAN' },
  { id: 'myp4c-12', rollNumber: 8294, name: 'HARSHIL BANKIMBHAI MEHTA' },
  { id: 'myp4c-13', rollNumber: 8138, name: 'ZAYAAN FARIYA MANSURI' },
  { id: 'myp4c-14', rollNumber: 7863, name: 'ANANT SINGH ARORA' },
  { id: 'myp4c-15', rollNumber: 8370, name: 'ARYAMAN PANKAJ KOTADIYA' },
  { id: 'myp4c-16', rollNumber: 7825, name: 'SHAURYA RAHUL MANE' },
  { id: 'myp4c-17', rollNumber: 8668, name: 'MANYA PINJANI' }
];

export const MYP5A_RAW: Student[] = [
  { id: 'myp5a-1', rollNumber: 8389, name: 'RUDRANSH VIVEK GANDHI' },
  { id: 'myp5a-2', rollNumber: 8283, name: 'RUDRA SAKHIYA' },
  { id: 'myp5a-3', rollNumber: 8217, name: 'AASMAA GAJERA' },
  { id: 'myp5a-4', rollNumber: 8185, name: 'AARNAVI REKHA APPASANI' },
  { id: 'myp5a-5', rollNumber: 8164, name: 'AKSHAJ VELLORE' },
  { id: 'myp5a-6', rollNumber: 8108, name: 'DIVA ADESHRA' },
  { id: 'myp5a-7', rollNumber: 8038, name: 'LAKSHMI KEERTHANA ERUGADINDLA' },
  { id: 'myp5a-8', rollNumber: 7987, name: 'SANVI SAJAY' },
  { id: 'myp5a-9', rollNumber: 7973, name: 'PRANAV GOBINATH' },
  { id: 'myp5a-10', rollNumber: 7737, name: 'TIARA AGRAWAL' },
  { id: 'myp5a-11', rollNumber: 7632, name: 'SAACHI AGARWAL' },
  { id: 'myp5a-12', rollNumber: 7490, name: 'KULDIP DUBISETTY' },
  { id: 'myp5a-13', rollNumber: 8499, name: 'NAINEISHA REDDY GUNREDDY' }
];

export const MYP5B_RAW: Student[] = [
  { id: 'myp5b-1', rollNumber: 8446, name: 'JINANSHI JAIN' },
  { id: 'myp5b-2', rollNumber: 8223, name: 'DEV KARIA' },
  { id: 'myp5b-3', rollNumber: 8218, name: 'NINA ASHWIN GANDHI' },
  { id: 'myp5b-4', rollNumber: 8168, name: 'SIDDHANT AKSHAY VASOYA' },
  { id: 'myp5b-5', rollNumber: 8162, name: 'VAIDEHI ANAND' },
  { id: 'myp5b-6', rollNumber: 8132, name: 'ANAV SINGH BHATIA' },
  { id: 'myp5b-7', rollNumber: 8024, name: 'ANAYA CHOKSI' },
  { id: 'myp5b-8', rollNumber: 7976, name: 'SATVIK AGRAWAL' },
  { id: 'myp5b-9', rollNumber: 7839, name: 'SAI SIDDHIKSHA SAKHAMURI' },
  { id: 'myp5b-10', rollNumber: 7789, name: 'VIDUSSHI JAIN' },
  { id: 'myp5b-11', rollNumber: 7645, name: 'YADHAVAR BABU' },
  { id: 'myp5b-12', rollNumber: 7588, name: 'ARNAV SAMRA' },
  { id: 'myp5b-13', rollNumber: 7336, name: 'SAANVI SUNIT PATEL' },
  { id: 'myp5b-14', rollNumber: 8157, name: 'YOGI KAKADIYA' }
];

// All MYP Classes with complete student sections
export const MYP_CLASSES: ClassSection[] = [
  { id: 'myp1-a', wing: 'MYP', grade: 'MYP 1', section: 'A', students: MYP1A_RAW },
  { id: 'myp1-b', wing: 'MYP', grade: 'MYP 1', section: 'B', students: MYP1B_RAW },
  { id: 'myp2-a', wing: 'MYP', grade: 'MYP 2', section: 'A', students: MYP2A_RAW },
  { id: 'myp2-b', wing: 'MYP', grade: 'MYP 2', section: 'B', students: MYP2B_RAW },
  { id: 'myp2-c', wing: 'MYP', grade: 'MYP 2', section: 'C', students: MYP2C_RAW },
  { id: 'myp3-a', wing: 'MYP', grade: 'MYP 3', section: 'A', students: MYP3A_RAW },
  { id: 'myp3-b', wing: 'MYP', grade: 'MYP 3', section: 'B', students: MYP3B_RAW },
  { id: 'myp4-a', wing: 'MYP', grade: 'MYP 4', section: 'A', students: MYP4A_RAW },
  { id: 'myp4-b', wing: 'MYP', grade: 'MYP 4', section: 'B', students: MYP4B_RAW },
  { id: 'myp4-c', wing: 'MYP', grade: 'MYP 4', section: 'C', students: MYP4C_RAW },
  { id: 'myp5-a', wing: 'MYP', grade: 'MYP 5', section: 'A', students: MYP5A_RAW },
  { id: 'myp5-b', wing: 'MYP', grade: 'MYP 5', section: 'B', students: MYP5B_RAW }
];

// --- HELPER TO GENERATE OTHER WINGS (MS, HS, HSS) ---
const generateSection = (wing: Wing, gradeLevel: number, section: string): ClassSection => {
    const students: Student[] = [];
    const classSize = 25;
    for(let i=1; i<=classSize; i++) {
        students.push({
            id: `${wing.toLowerCase()}${gradeLevel}${section.toLowerCase()}-${i}`,
            rollNumber: i,
            name: `STUDENT ${wing} ${gradeLevel}${section}-${i}`.toUpperCase()
        });
    }
    
    return {
        id: `${wing.toLowerCase()}${gradeLevel}-${section.toLowerCase()}`,
        wing: wing,
        grade: wing === 'HSS' ? `Grade ${gradeLevel}` : `Grade ${gradeLevel}`,
        section: section,
        students: students
    };
};

const SECTIONS = ['A', 'B', 'C', 'D'];

// Generate MS Classes (6, 7, 8) - 4 Sections each
const MS_CLASSES: ClassSection[] = [];
[6, 7, 8].forEach(grade => {
    SECTIONS.forEach(sec => MS_CLASSES.push(generateSection('MS', grade, sec)));
});

// Generate HS Classes (9, 10) - 4 Sections each
const HS_CLASSES: ClassSection[] = [];
[9, 10].forEach(grade => {
    SECTIONS.forEach(sec => HS_CLASSES.push(generateSection('HS', grade, sec)));
});

// Generate HSS Classes (11, 12) - 4 Sections each
const HSS_CLASSES: ClassSection[] = [];
[11, 12].forEach(grade => {
    SECTIONS.forEach(sec => HSS_CLASSES.push(generateSection('HSS', grade, sec)));
});

export const ALL_CLASSES_INITIAL = [
    ...MYP_CLASSES,
    ...MS_CLASSES,
    ...HS_CLASSES,
    ...HSS_CLASSES
];
