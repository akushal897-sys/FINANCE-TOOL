import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import IncomeTax from '@/pages/IncomeTax';
import EMI from '@/pages/EMI';
import SIP from '@/pages/SIP';
import GST from '@/pages/GST';
import Salary from '@/pages/Salary';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/income-tax" element={<IncomeTax />} />
          <Route path="/emi" element={<EMI />} />
          <Route path="/sip" element={<SIP />} />
          <Route path="/gst" element={<GST />} />
          <Route path="/salary" element={<Salary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
