import inquirer from "inquirer";
import shellJs from "shelljs";

export default abstract class ServiceContract {
  protected readonly shellCommander: typeof shellJs;

  protected readonly shellInputs: typeof inquirer;

  protected constructor() {
    this.shellCommander = shellJs;
    this.shellInputs = inquirer;
  }

  abstract handle(): Promise<void>;
}
