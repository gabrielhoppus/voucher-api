import voucherRepository from "repositories/voucherRepository"
import voucherService from "../../src/services/voucherService"
import { jest } from "@jest/globals";
import { conflictError } from "utils/errorUtils";


describe("create voucher", () => {
    it("should respond with conflit error if the voucher already exists", async () => {
        const voucher = {
            id: 1,
            code: "XXXX",
            discount: 30,
            applied: false
        }
        const code = "XXXX";
        const discount = 30;
        jest.spyOn(voucherRepository, "getVoucherByCode").mockImplementationOnce((): any => voucher);
        jest.spyOn(voucherRepository, "createVoucher").mockImplementationOnce((): any => true);
        const response = voucherService.createVoucher(code, discount);
        expect(response).rejects.toEqual(conflictError("Voucher already exist."))
    });
    
    it('should create voucher and return nothing', async () => {
        const voucher = {
            code: "XXXX",
            discount: 10,
        }
        jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(undefined);

        const response = await voucherService.createVoucher(voucher.code, voucher.discount);
        expect(response).toEqual(undefined)
    });
});

describe("applying voucher", () => {
    it("should apply discount for valid vouchers used on mininum values for discount", async () => {
        const voucher = {
            code: "ABC",
            discount: 15
        };

        jest.spyOn(voucherRepository, "getVoucherByCode").mockImplementationOnce((): any => {
            return {
                id: 1,
                code: voucher.code,
                discount: voucher.discount,
                applied: false
            };
        });

        jest.spyOn(voucherRepository, "useVoucher").mockImplementation((): any => { });

        const amount = 101;
        const finalAmount = amount * ((1 - (voucher.discount/100)))
        const response = await voucherService.applyVoucher(voucher.code, amount);
        expect(response.amount).toEqual(101);
        expect(response.discount).toEqual(15);
        expect(response.finalAmount).toEqual(finalAmount);
        expect(response.applied).toEqual(true);
    });

    it("should not apply discount for valid vouchers used on below mininum value for discount", async () => {
        const voucher = {
            code: "ABC",
            discount: 15
        };

        jest.spyOn(voucherRepository, "getVoucherByCode").mockImplementationOnce((): any => {
            return {
                id: 1,
                code: voucher.code,
                discount: voucher.discount,
                applied: false
            };
        });

        jest.spyOn(voucherRepository, "useVoucher").mockImplementation((): any => { });

        const amount = 99;
        const response = await voucherService.applyVoucher(voucher.code, amount);
        expect(response.amount).toEqual(99);
        expect(response.discount).toEqual(15);
        expect(response.finalAmount).toEqual(amount);
        expect(response.applied).toEqual(false);
    });

    it("should not apply discount for already used vouchers", async () => {
        const voucher = {
            code: "ABC",
            discount: 15,
        };

        jest.spyOn(voucherRepository, "getVoucherByCode").mockImplementationOnce((): any => {
            return {
                id: 1,
                code: voucher.code,
                discount: voucher.discount,
                used: true
            };
        });

        jest.spyOn(voucherRepository, "useVoucher").mockImplementationOnce((): any => false);

        const amount = 100;
        const response = await voucherService.applyVoucher(voucher.code, amount);
        expect(response.amount).toEqual(amount);
        expect(response.discount).toEqual(15);
        expect(response.finalAmount).toEqual(amount);
        expect(response.applied).toEqual(false);
    });

    it('should throw conflict error if voucher does not exist', async () => {
        const voucher = {
            code: "ABC",
            amount: 100
        };

        jest.spyOn(voucherRepository, "getVoucherByCode").mockResolvedValueOnce(undefined);


        const response = voucherService.applyVoucher(voucher.code, voucher.amount);

        expect(response).rejects.toEqual({
            message: "Voucher does not exist.",
            type: "conflict",
        })
    });

    
});
