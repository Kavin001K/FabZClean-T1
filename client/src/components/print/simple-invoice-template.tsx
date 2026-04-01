import React from 'react';
import InvoiceTemplateIN, { type InvoiceData } from './invoice-template-in';

const SimpleInvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => {
  return <InvoiceTemplateIN data={{ ...data, enableGST: false }} />;
};

export default SimpleInvoiceTemplate;
