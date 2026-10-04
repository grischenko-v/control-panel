export class SemanticVersion {
  static pattern = /^(?:v)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

  constructor(major, minor, patch) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    Object.freeze(this);
  }

  static parse(value) {
    const match = SemanticVersion.pattern.exec(String(value).trim());
    return match
      ? new SemanticVersion(Number(match[1]), Number(match[2]), Number(match[3]))
      : undefined;
  }

  compareTo(other) {
    return this.major - other.major || this.minor - other.minor || this.patch - other.patch;
  }

  increment(kind) {
    if (kind === 'major') return new SemanticVersion(this.major + 1, 0, 0);
    if (kind === 'minor') return new SemanticVersion(this.major, this.minor + 1, 0);
    return new SemanticVersion(this.major, this.minor, this.patch + 1);
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}

export class ReleaseTag {
  constructor(version) {
    this.version = version;
    Object.freeze(this);
  }

  static parse(value) {
    const candidate = String(value ?? '').trim();
    if (!candidate.startsWith('v')) return undefined;
    const version = SemanticVersion.parse(candidate.slice(1));
    return version ? new ReleaseTag(version) : undefined;
  }

  toString() {
    return `v${this.version}`;
  }
}
