import emailClassifier from "../../../examples/email-classifier.spec.json";
import docSummarizer from "../../../examples/doc-summarizer.spec.json";
import customerSupportReplier from "../../../examples/customer-support-replier.spec.json";
import type { Spec } from "../spec-schema";

export const exampleSpecs: Spec[] = [
  emailClassifier as Spec,
  docSummarizer as Spec,
  customerSupportReplier as Spec,
];
