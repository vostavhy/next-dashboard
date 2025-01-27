'use server';

import { date, z } from 'zod';
import { client } from '../seed/route';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type State = {
  message?: string | null;
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter amount greater than 0' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { status, customerId, amount } = validatedFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await client.query(
      `
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES ($1, $2, $3, $4)
  `,
      [customerId, amountInCents, status, date]
    );
  } catch (error) {
    console.log('Error creating invoice:');
    console.log(error);
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  // Update invoice
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  try {
    await client.query(
      `
    UPDATE invoices
    SET customer_id = $1, amount = $2, status = $3
    WHERE id = $4
  `,
      [customerId, amountInCents, status, id]
    );
  } catch (error) {}

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // delete invoice
  await client.query(
    `
    DELETE FROM invoices
    WHERE id = $1
  `,
    [id]
  );

  revalidatePath('/dashboard/invoices');
}
