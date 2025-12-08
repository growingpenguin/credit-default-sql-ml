package com.creditwise.config;

import com.creditwise.entity.LoanProduct;
import com.creditwise.repository.LoanProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Data Loader
 * ===========
 * Seeds the database with LendingClub-based loan products on startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final LoanProductRepository loanProductRepository;

    @Override
    public void run(String... args) {
        if (loanProductRepository.count() == 0) {
            log.info("Seeding loan products...");
            seedLoanProducts();
            log.info("✅ Seeded {} loan products", loanProductRepository.count());
        } else {
            log.info("Loan products already exist: {} products", loanProductRepository.count());
        }
    }

    private void seedLoanProducts() {
        List<LoanProduct> products = Arrays.asList(
            // Grade A - Excellent Credit (720+ FICO)
            LoanProduct.builder()
                .productId("LC-A1-PERSONAL")
                .productName("Prime Personal Loan")
                .lenderName("LendingClub")
                .loanType("personal")
                .grade("A")
                .minCreditScore(720)
                .maxCreditScore(850)
                .minApr(6.99)
                .maxApr(8.99)
                .minAmount(1000.0)
                .maxAmount(40000.0)
                .termsMonths("36,60")
                .originationFeePct(1.0)
                .description("Best rates for excellent credit. Fast funding within 24 hours.")
                .build(),

            LoanProduct.builder()
                .productId("LC-A2-DEBT")
                .productName("Debt Consolidation Plus")
                .lenderName("LendingClub")
                .loanType("debt_consolidation")
                .grade("A")
                .minCreditScore(720)
                .maxCreditScore(850)
                .minApr(5.99)
                .maxApr(7.99)
                .minAmount(5000.0)
                .maxAmount(50000.0)
                .termsMonths("36,48,60")
                .originationFeePct(0.5)
                .description("Consolidate high-interest debt into one low monthly payment.")
                .build(),

            // Grade B - Good Credit (680-719 FICO)
            LoanProduct.builder()
                .productId("LC-B1-PERSONAL")
                .productName("Flexible Personal Loan")
                .lenderName("LendingClub")
                .loanType("personal")
                .grade("B")
                .minCreditScore(680)
                .maxCreditScore(719)
                .minApr(10.49)
                .maxApr(13.99)
                .minAmount(1000.0)
                .maxAmount(35000.0)
                .termsMonths("36,60")
                .originationFeePct(2.0)
                .description("Competitive rates for good credit profiles.")
                .build(),

            LoanProduct.builder()
                .productId("LC-B2-HOME")
                .productName("Home Improvement Loan")
                .lenderName("LendingClub")
                .loanType("home")
                .grade("B")
                .minCreditScore(680)
                .maxCreditScore(719)
                .minApr(9.99)
                .maxApr(12.99)
                .minAmount(5000.0)
                .maxAmount(45000.0)
                .termsMonths("36,48,60")
                .originationFeePct(1.5)
                .description("Fund your home renovation projects with fixed monthly payments.")
                .build(),

            // Grade C - Fair Credit (660-679 FICO)
            LoanProduct.builder()
                .productId("LC-C1-PERSONAL")
                .productName("Standard Personal Loan")
                .lenderName("LendingClub")
                .loanType("personal")
                .grade("C")
                .minCreditScore(660)
                .maxCreditScore(679)
                .minApr(14.99)
                .maxApr(18.99)
                .minAmount(1000.0)
                .maxAmount(25000.0)
                .termsMonths("36,60")
                .originationFeePct(3.0)
                .description("Personal loans for fair credit with no prepayment penalties.")
                .build(),

            LoanProduct.builder()
                .productId("LC-C2-CAR")
                .productName("Auto Refinance Loan")
                .lenderName("LendingClub")
                .loanType("car")
                .grade("C")
                .minCreditScore(660)
                .maxCreditScore(679)
                .minApr(13.99)
                .maxApr(17.49)
                .minAmount(5000.0)
                .maxAmount(35000.0)
                .termsMonths("36,48,60")
                .originationFeePct(2.5)
                .description("Refinance your auto loan and potentially lower your rate.")
                .build(),

            // Grade D - Below Average (640-659 FICO)
            LoanProduct.builder()
                .productId("LC-D1-PERSONAL")
                .productName("Credit Builder Loan")
                .lenderName("LendingClub")
                .loanType("personal")
                .grade("D")
                .minCreditScore(640)
                .maxCreditScore(659)
                .minApr(19.99)
                .maxApr(23.99)
                .minAmount(1000.0)
                .maxAmount(15000.0)
                .termsMonths("36,48")
                .originationFeePct(4.0)
                .description("Build your credit history with on-time payments reported to bureaus.")
                .build(),

            // Grade E - Poor Credit (620-639 FICO)
            LoanProduct.builder()
                .productId("LC-E1-PERSONAL")
                .productName("Second Chance Loan")
                .lenderName("LendingClub")
                .loanType("personal")
                .grade("E")
                .minCreditScore(620)
                .maxCreditScore(639)
                .minApr(24.99)
                .maxApr(28.99)
                .minAmount(1000.0)
                .maxAmount(10000.0)
                .termsMonths("36")
                .originationFeePct(5.0)
                .description("A chance to get funding and rebuild your credit profile.")
                .build(),

            // Additional Lenders
            LoanProduct.builder()
                .productId("SOFI-A1-PERSONAL")
                .productName("SoFi Personal Loan")
                .lenderName("SoFi")
                .loanType("personal")
                .grade("A")
                .minCreditScore(720)
                .maxCreditScore(850)
                .minApr(8.99)
                .maxApr(12.99)
                .minAmount(5000.0)
                .maxAmount(100000.0)
                .termsMonths("24,36,48,60,72,84")
                .originationFeePct(0.0)
                .description("No fees. Unemployment protection included. Member benefits.")
                .build(),

            LoanProduct.builder()
                .productId("PROSPER-B1-PERSONAL")
                .productName("Prosper Personal Loan")
                .lenderName("Prosper")
                .loanType("personal")
                .grade("B")
                .minCreditScore(680)
                .maxCreditScore(719)
                .minApr(8.99)
                .maxApr(17.99)
                .minAmount(2000.0)
                .maxAmount(50000.0)
                .termsMonths("36,60")
                .originationFeePct(2.4)
                .description("Peer-to-peer lending with competitive rates.")
                .build(),

            LoanProduct.builder()
                .productId("UPSTART-C1-PERSONAL")
                .productName("Upstart AI Loan")
                .lenderName("Upstart")
                .loanType("personal")
                .grade("C")
                .minCreditScore(620)
                .maxCreditScore(679)
                .minApr(12.99)
                .maxApr(29.99)
                .minAmount(1000.0)
                .maxAmount(50000.0)
                .termsMonths("36,60")
                .originationFeePct(4.0)
                .description("AI-powered approval. Looks beyond credit score.")
                .build(),

            LoanProduct.builder()
                .productId("MARCUS-A1-DEBT")
                .productName("Marcus Debt Consolidation")
                .lenderName("Marcus by Goldman Sachs")
                .loanType("debt_consolidation")
                .grade("A")
                .minCreditScore(720)
                .maxCreditScore(850)
                .minApr(6.99)
                .maxApr(19.99)
                .minAmount(3500.0)
                .maxAmount(40000.0)
                .termsMonths("36,48,60,72")
                .originationFeePct(0.0)
                .description("No fees. Direct payment to creditors available.")
                .build(),

            LoanProduct.builder()
                .productId("DISCOVER-B1-PERSONAL")
                .productName("Discover Personal Loan")
                .lenderName("Discover")
                .loanType("personal")
                .grade("B")
                .minCreditScore(680)
                .maxCreditScore(719)
                .minApr(7.99)
                .maxApr(24.99)
                .minAmount(2500.0)
                .maxAmount(35000.0)
                .termsMonths("36,48,60,72,84")
                .originationFeePct(0.0)
                .description("No origination fees. Flexible terms up to 84 months.")
                .build()
        );

        loanProductRepository.saveAll(products);
    }
}

