export type DeliveryArea = {
  value: string;
  label: string;
  charge: number;
};

export type DeliveryZone = {
  value: string;
  label: string;
  areas: DeliveryArea[];
};

export type DeliveryDivision = {
  value: string;
  label: string;
  zones: DeliveryZone[];
};

const areas = (items: [string, string, number][]): DeliveryArea[] =>
  items.map(([value, label, charge]) => ({ value, label, charge }));

export const DELIVERY_DATA: DeliveryDivision[] = [
  {
    value: 'dhaka', label: 'Dhaka', zones: [
      { value: 'dhaka_north', label: 'Dhaka North', areas: areas([
        ['uttara', 'Uttara', 80], ['mirpur', 'Mirpur', 80], ['pallabi', 'Pallabi', 80],
        ['gulshan', 'Gulshan', 80], ['banani', 'Banani', 80], ['badda', 'Badda', 80],
        ['khilkhet', 'Khilkhet', 80], ['turag', 'Turag', 80], ['cantonment', 'Cantonment', 80], ['tejgaon', 'Tejgaon', 80],
      ]) },
      { value: 'dhaka_south', label: 'Dhaka South', areas: areas([
        ['old_dhaka', 'Old Dhaka', 80], ['lalbagh', 'Lalbagh', 80], ['hazaribagh', 'Hazaribagh', 80],
        ['kotwali', 'Kotwali', 80], ['motijheel', 'Motijheel', 80], ['wari', 'Wari', 80], ['demra', 'Demra', 80],
      ]) },
      { value: 'gazipur', label: 'Gazipur', areas: areas([
        ['gazipur_sadar', 'Gazipur Sadar', 120], ['tongi', 'Tongi', 120], ['kaliakair', 'Kaliakair', 150], ['kapasia', 'Kapasia', 150], ['sreepur', 'Sreepur', 150],
      ]) },
      { value: 'narayanganj', label: 'Narayanganj', areas: areas([
        ['narayanganj_sadar', 'Narayanganj Sadar', 120], ['fatullah', 'Fatullah', 120], ['siddhirganj', 'Siddhirganj', 120], ['rupganj', 'Rupganj', 150], ['araihazar', 'Araihazar', 150], ['sonargaon', 'Sonargaon', 150],
      ]) },
      { value: 'savarnbhaber', label: 'Savar / Ashulia', areas: areas([
        ['savar', 'Savar', 100], ['ashulia', 'Ashulia', 100], ['hemayetpur', 'Hemayetpur', 120], ['dhamrai', 'Dhamrai', 150],
      ]) },
      { value: 'keraniganj', label: 'Keraniganj', areas: areas([['keraniganj', 'Keraniganj', 100], ['zinzira', 'Zinzira', 100]]) },
    ],
  },
  {
    value: 'chattogram', label: 'Chattogram', zones: [
      { value: 'chattogram_city', label: 'Chattogram City', areas: areas([
        ['kotwali_ctg', 'Kotwali', 150], ['panchlaish', 'Panchlaish', 150], ['pahartali', 'Pahartali', 150], ['halishahar', 'Halishahar', 150], ['bayezid', 'Bayezid', 150], ['agrabad', 'Agrabad', 150], ['nasirabad', 'Nasirabad', 150],
      ]) },
      { value: 'chittagong_districts', label: 'Chittagong Districts', areas: areas([
        ['sitakunda', 'Sitakunda', 150], ['mirsharai', 'Mirsharai', 150], ['fatikchhari', 'Fatikchhari', 150], ['rangunia', 'Rangunia', 150], ['anwara', 'Anwara', 150], ['patiya', 'Patiya', 150], ['boalkhali', 'Boalkhali', 150], ['satkania', 'Satkania', 150],
      ]) },
      { value: 'cox_bazar', label: "Cox's Bazar", areas: areas([
        ['coxs_bazar_sadar', "Cox's Bazar Sadar", 150], ['chakaria', 'Chakaria', 150], ['kutubdia', 'Kutubdia', 150], ['teknaf', 'Teknaf', 150],
      ]) },
    ],
  },
  {
    value: 'rajshahi', label: 'Rajshahi', zones: [
      { value: 'rajshahi_city', label: 'Rajshahi City', areas: areas([['boalia', 'Boalia', 150], ['rajpara', 'Rajpara', 150], ['motihar', 'Motihar', 150], ['shah_makhdum', 'Shah Makhdum', 150]]) },
      { value: 'rajshahi_districts', label: 'Rajshahi Districts', areas: areas([['paba', 'Paba', 150], ['godagari', 'Godagari', 150], ['tanore', 'Tanore', 150], ['bagmara', 'Bagmara', 150], ['charghat', 'Charghat', 150], ['durgapur', 'Durgapur', 150]]) },
      { value: 'bogura', label: 'Bogura', areas: areas([['bogura_sadar', 'Bogura Sadar', 150], ['shibganj_bog', 'Shibganj', 150], ['gabtali', 'Gabtali', 150], ['sherpur_bog', 'Sherpur', 150]]) },
      { value: 'natore', label: 'Natore', areas: areas([['natore_sadar', 'Natore Sadar', 150], ['singra', 'Singra', 150], ['lalpur', 'Lalpur', 150], ['baraigram', 'Baraigram', 150]]) },
    ],
  },
  {
    value: 'khulna', label: 'Khulna', zones: [
      { value: 'khulna_city', label: 'Khulna City', areas: areas([['khulna_sadar', 'Khulna Sadar', 150], ['sonadanga', 'Sonadanga', 150], ['khalishpur', 'Khalishpur', 150], ['daulatpur_kh', 'Daulatpur', 150]]) },
      { value: 'jessore', label: 'Jashore (Jessore)', areas: areas([['jessore_sadar', 'Jashore Sadar', 150], ['benapole', 'Benapole', 150], ['chaugachha', 'Chaugachha', 150], ['sharsha', 'Sharsha', 150]]) },
      { value: 'satkhira', label: 'Satkhira', areas: areas([['satkhira_sadar', 'Satkhira Sadar', 150], ['shyamnagar', 'Shyamnagar', 150], ['kalaroa', 'Kalaroa', 150]]) },
    ],
  },
  {
    value: 'barishal', label: 'Barishal', zones: [
      { value: 'barishal_city', label: 'Barishal City', areas: areas([['barisal_sadar', 'Barisal Sadar', 150], ['kotwali_bsl', 'Kotwali', 150], ['airport_bsl', 'Airport', 150], ['kashipur', 'Kashipur', 150]]) },
      { value: 'bhola', label: 'Bhola', areas: areas([['bhola_sadar', 'Bhola Sadar', 150], ['charfasson', 'Charfasson', 150], ['lalmohan', 'Lalmohan', 150], ['burhanuddin', 'Burhanuddin', 150]]) },
      { value: 'patuakhali', label: 'Patuakhali', areas: areas([['patuakhali_sadar', 'Patuakhali Sadar', 150], ['kuakata', 'Kuakata', 150], ['bauphal', 'Bauphal', 150]]) },
    ],
  },
  {
    value: 'sylhet', label: 'Sylhet', zones: [
      { value: 'sylhet_city', label: 'Sylhet City', areas: areas([['sylhet_sadar', 'Sylhet Sadar', 150], ['ambarkhana', 'Ambarkhana', 150], ['zindabazar', 'Zindabazar', 150], ['shibganj_syl', 'Shibganj', 150]]) },
      { value: 'moulvibazar', label: 'Moulvibazar', areas: areas([['moulvibazar_sadar', 'Moulvibazar Sadar', 150], ['sreemangal', 'Sreemangal', 150], ['kamalganj', 'Kamalganj', 150], ['kulaura', 'Kulaura', 150]]) },
      { value: 'habiganj', label: 'Habiganj', areas: areas([['habiganj_sadar', 'Habiganj Sadar', 150], ['chunarughat', 'Chunarughat', 150], ['baniachong', 'Baniachong', 150]]) },
    ],
  },
  {
    value: 'rangpur', label: 'Rangpur', zones: [
      { value: 'rangpur_city', label: 'Rangpur City', areas: areas([['rangpur_sadar', 'Rangpur Sadar', 150], ['kotwali_rng', 'Kotwali', 150], ['mithapukur', 'Mithapukur', 150], ['badarganj', 'Badarganj', 150]]) },
      { value: 'dinajpur', label: 'Dinajpur', areas: areas([['dinajpur_sadar', 'Dinajpur Sadar', 150], ['chirirbandar', 'Chirirbandar', 150], ['parbatipur', 'Parbatipur', 150], ['birampur', 'Birampur', 150]]) },
      { value: 'kurigram', label: 'Kurigram', areas: areas([['kurigram_sadar', 'Kurigram Sadar', 150], ['nageshwari', 'Nageshwari', 150], ['ulipur', 'Ulipur', 150]]) },
    ],
  },
  {
    value: 'mymensingh', label: 'Mymensingh', zones: [
      { value: 'mymensingh_city', label: 'Mymensingh City', areas: areas([['mymensingh_sadar', 'Mymensingh Sadar', 150], ['kotwali_mym', 'Kotwali', 150], ['muktagacha', 'Muktagacha', 150], ['trishal', 'Trishal', 150]]) },
      { value: 'tangail', label: 'Tangail', areas: areas([['tangail_sadar', 'Tangail Sadar', 150], ['ghatail', 'Ghatail', 150], ['mirzapur', 'Mirzapur', 150], ['basail', 'Basail', 150]]) },
      { value: 'jamalpur', label: 'Jamalpur', areas: areas([['jamalpur_sadar', 'Jamalpur Sadar', 150], ['islampur', 'Islampur', 150], ['melandaha', 'Melandaha', 150], ['dewanganj', 'Dewanganj', 150]]) },
      { value: 'netrokona', label: 'Netrokona', areas: areas([['netrokona_sadar', 'Netrokona Sadar', 150], ['kendua', 'Kendua', 150], ['mohanganj', 'Mohanganj', 150]]) },
    ],
  },
];

export function getCharge(areaValue: string): number {
  for (const division of DELIVERY_DATA) {
    for (const zone of division.zones) {
      const area = zone.areas.find((item) => item.value === areaValue);
      if (area) return area.charge;
    }
  }
  return 0;
}